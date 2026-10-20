'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, mix, span, TAU, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'barcode', title: 'Barcode', category: 'signal', technique: 'lines',
  tags: ['topology', 'persistence', 'filtration', 'cycles', 'dataset', 'analysis'],
  description: 'A filtered complex connects its perimeter, adds radial edges, and fills its triangular faces. Every enclosed cycle writes its computed lifetime to a barcode below; long and short holes close at different stages, then the filtration unwrites back to isolated sites.',
  order: 64,
  colors: [{ part: 'Lifetimes', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
interface Cell { vertices: number[]; dim: number; at: number; boundary: number[] }
// Persistent H1 over the two-element field: reduce each boundary column by
// symmetric difference. A zero edge column births a cycle; a triangular
// column pairs with the edge that dies. Bars are data, not timed decoration.
const LEVELS = [4, 6].map(n => {
  const vertices: V3[] = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + TAU * i / n
    return [28 * Math.cos(a), 0, 28 * Math.sin(a)]
  })
  vertices.push([0, 0, 0])
  const cells: Cell[] = vertices.map((_, i) => ({ vertices: [i], dim: 0, at: 0, boundary: [] }))
  const edges = new Map<string, number>()
  const edgeKey = (a: number, b: number) => `${Math.min(a, b)}:${Math.max(a, b)}`
  const edge = (a: number, b: number, at: number) => {
    edges.set(edgeKey(a, b), cells.length)
    cells.push({ vertices: [a, b], dim: 1, at, boundary: [a, b] })
  }
  for (let i = 0; i < n; i++) edge(i, (i + 1) % n, 0.08 + i * 0.22 / (n - 1))
  for (let i = 0; i < n; i++) edge(n, i, 0.34 + i * 0.11 / (n - 1))
  for (let i = 0; i < n; i++) cells.push({ vertices: [n, i, (i + 1) % n], dim: 2, at: 0.5 + i * 0.17 / (n - 1), boundary: [edges.get(edgeKey(n, i))!, edges.get(edgeKey(i, (i + 1) % n))!, edges.get(edgeKey(n, (i + 1) % n))!] })
  const pivots = new Map<number, Set<number>>()
  const bars: { birth: number; death: number }[] = []
  for (const cell of cells) {
    const column = new Set(cell.boundary)
    while (column.size) {
      const low = Math.max(...column)
      const previous = pivots.get(low)
      if (!previous) {
        pivots.set(low, new Set(column))
        if (cell.dim === 2) bars.push({ birth: cells[low]!.at, death: cell.at })
        break
      }
      for (const entry of previous) { if (column.has(entry)) column.delete(entry); else column.add(entry) }
    }
  }
  bars.sort((a, b) => a.birth - b.birth)
  return { vertices, cells, bars }
})
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []
const projected = Array.from({ length: 7 }, point)

/* Color: a lifetime bar is `c1` while its cycle lives, and settles
 * to the ink once it dies. */

export const scene: Scene = {
  beats: 6, still: 0.57,
  draw(pen, t, view) {
    const small = view.size < 32
    const { vertices, cells, bars } = LEVELS[small ? 0 : 1]!
    const hair = (small ? 1.05 : 1) / view.px
    const project = camera({ yaw: -0.16, pitch: -0.94, distance: 270, cx: view.w / 2, cy: 34 })
    const time = 0.74 * (span(t, 0.02, 0.66) - span(t, 0.76, 0.98))
    vertices.forEach((v, i) => project(...v, projected[i]!))
    // The complex keeps a fine ghost throughout. New edges grow from their
    // own vertices; filled faces remain behind every edge and hollow site.
    cells.forEach(cell => {
      if (cell.dim === 0) return
      const set = view.ease.standard(span(time, cell.at, cell.at + 0.055))
      if (cell.dim === 1) {
        const a = projected[cell.vertices[0]!]!, b = projected[cell.vertices[1]!]!
        depth.line(a, b, hair * 0.7, 0.18)
        if (set > 0.004) {
          q.x = mix(a.x, b.x, set); q.y = mix(a.y, b.y, set); q.z = mix(a.z, b.z, set); q.k = mix(a.k, b.k, set)
          depth.line(a, q, hair * (small ? 1.2 : 1.05), 0.85 * set)
        }
      } else if (set > 0.004) {
        xy.length = 0
        let z = 0
        for (const vertex of cell.vertices) { const v = projected[vertex]!; xy.push(v.x, v.y); z += v.z / 3 }
        depth.poly(xy, -100 + z * 0.01, 0.17 * set)
        if (!small) {
          // A short interior hatch makes a filled simplex distinct from
          // an empty cycle even on a dark background.
          const a = vertices[cell.vertices[1]!]!, b = vertices[cell.vertices[2]!]!
          project(a[0] * 0.3, 0.1, a[2] * 0.3, p); project(b[0] * 0.3, 0.1, b[2] * 0.3, q)
          depth.line(p, q, hair * 0.7, set * 0.4)
        }
      }
    })
    for (let vertex = 0; vertex < vertices.length; vertex++) {
      const v = projected[vertex]!
      const r = (small ? 1.5 : 1.8) * hair * v.k
      xy.length = 0
      for (let j = 0; j < 16; j++) { const a = TAU * j / 16; xy.push(v.x + r * Math.cos(a), v.y + r * Math.sin(a)) }
      depth.poly(xy, 100 + v.z * 0.01, 0, 'ink', true)
      depth.path(xy, 101 + v.z * 0.01, { width: hair * 0.85, alpha: 0.88, closed: true })
    }
    depth.flush(pen)

    const left = 15, right = 85
    const at = (value: number) => mix(left, right, value / 0.74)
    pen.line(left, 65, right, 65, hair * 0.7, 0.3)
    if (!small) for (let i = 0; i <= 4; i++) pen.line(mix(left, right, i / 4), 65, mix(left, right, i / 4), 62.5, hair * 0.7, 0.25)
    bars.forEach(({ birth, death }, i) => {
      const show = view.ease.enter(span(time, birth, birth + 0.045))
      const end = Math.min(death, time)
      if (show <= 0.004) return
      const y = 70 + i * (small ? 6.4 : 3.8)
      const alive = 1 - view.ease.exit(span(time, death, death + 0.04))
      pen.line(at(birth), y, at(end), y, hair * (small ? 0.9 : 1.15), (0.55 + 0.35 * alive) * show, i === 0 ? 'accent' : blend('ink', 'c1', 0.75 * alive))
      if (!small) {
        pen.line(at(birth), y - 1.1, at(birth), y + 1.1, hair * 0.75, show * 0.6)
        if (time >= death) pen.line(at(death), y - 1.1, at(death), y + 1.1, hair * 0.75, 0.6)
      }
    })
    // The filtration cursor reads both the geometry and the lifetime axis.
    const cursor = view.ease.enter(span(t, 0.02, 0.07)) * (1 - view.ease.exit(span(t, 0.94, 0.98)))
    if (cursor > 0.004) pen.line(at(time), 63, at(time), 67, hair, cursor * 0.8)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A simplicial filtration writes the computed lifetimes of its enclosed cycles. */
export function LoaderBarcode(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
