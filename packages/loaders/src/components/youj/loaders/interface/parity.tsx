'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, lambert, orient, span, Depth, point, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'parity', title: 'Parity', category: 'interface', technique: 'planes',
  tags: ['cellular', 'automaton', 'xor', 'logic', 'grid', 'computation'],
  description: 'A raised cellular grid recomputes itself row by row after its seed shifts. Each cell takes the exclusive-or of its two parents; a narrow read line follows the write, then a second pass restores the original seed and all its descendants.',
  order: 11,
  colors: [{ part: 'Values', mono: 'ink' }],
} satisfies LoaderMeta

interface Grid { cols: number; rows: number; a: number[][]; b: number[][] }
function grid(cols: number, rows: number): Grid {
  const generations = (seed: number) => {
    const cells: number[][] = [Array.from({ length: cols }, (_, c) => c === seed ? 1 : 0)]
    for (let r = 1; r < rows; r++) cells.push(cells[r - 1]!.map((_, c, previous) => previous[(c + cols - 1) % cols]! ^ previous[(c + 1) % cols]!))
    return cells
  }
  return { cols, rows, a: generations(Math.floor(cols / 2)), b: generations(Math.floor(cols / 2) + 1) }
}
const grids = [grid(3, 3), grid(5, 4)]
const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []
/** The four world corners of the quad being drawn.
 *
 * Color: each column’s top edge, the value it holds, is `c1`; the columns’ faces and the grid keep the ink, the row being written the accent. */
const QUAD: [number, number, number][] = Array.from({ length: 4 }, () => [0, 0, 0])
/** A cell's corners round its centre, in order. */
const RIM = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const

export const scene: Scene = {
  beats: 6,
  still: 0.29,
  draw(pen, t, view) {
    t %= 1
    const small = view.size < 32
    const { cols, rows, a, b } = grids[small ? 0 : 1]!
    const hair = (small ? 1 : 0.9) / view.px
    const gapX = small ? 19.5 : 15.2
    const gapZ = small ? 23 : 18.8
    const half = small ? 6 : 5.4
    const pose = { yaw: -0.38, pitch: -0.67 }
    const project = camera({ ...pose, distance: 330, cx: view.w / 2, cy: view.h / 2 + (small ? 4 : 2) })
    const turn = orient(pose)
    const cellX = (c: number) => (c - (cols - 1) / 2) * gapX
    const cellZ = (r: number) => (r - (rows - 1) / 2) * gapZ
    /** A lit quad through four world points, outlined, if it faces the viewer. */
    const quad = (n: readonly [number, number, number], outline: number, tone: Tone = 'ink') => {
      const normal = turn(n[0], n[1], n[2])
      if (normal[2] <= 0) return
      xy.length = 0
      let zz = 0
      for (const v of QUAD) {
        project(v[0], v[1], v[2], p)
        xy.push(p.x, p.y)
        zz += p.z / 4
      }
      depth.face(xy, zz, lambert(...normal))
      if (outline > 0) depth.path(xy, zz + 0.01, { width: hair * 0.7, alpha: outline, closed: true, tone })
    }
    const set = (i: number, x: number, y: number, z: number) => {
      QUAD[i]![0] = x
      QUAD[i]![1] = y
      QUAD[i]![2] = z
    }
    if (view.size >= 80) for (let r = 1; r < rows; r++) for (let c = 0; c < cols; c++) for (const offset of [-1, 1]) {
      const parent = (c + cols + offset) % cols
      if (Math.abs(parent - c) > 1) continue
      project(cellX(parent), -1, cellZ(r - 1) + half, p)
      project(cellX(c), -1, cellZ(r) - half, q)
      depth.line(p, q, hair * 0.6, 0.2)
    }
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const forward = 0.04 + r * (0.48 / rows) + c * 0.008
      const reverse = 0.56 + r * (0.4 / rows) + c * 0.008
      const write = view.ease.emphasized(span(t, forward, forward + 0.11)) - view.ease.emphasized(span(t, reverse, reverse + 0.1))
      const value = a[r]![c]! + (b[r]![c]! - a[r]![c]!) * write
      const x = cellX(c)
      const z = cellZ(r)
      // Every cell is a shallow well: its rim on the floor, a chamfer stepping down to its bed.
      for (const [inset, y, alpha] of small ? [[1, 0, 0.34]] : [[1, 0, 0.3], [0.74, -1, 0.16]]) {
        const s = half * inset!
        xy.length = 0
        let zz = 0
        for (const [sx, sz] of RIM) {
          project(x + sx * s, y!, z + sz * s, p)
          xy.push(p.x, p.y)
          zz += p.z / 4
        }
        depth.path(xy, zz - 20, { width: hair * 0.8, alpha: alpha!, closed: true })
      }
      // A raised bit is an opaque lit solid, so the grid reads as binary state even without colour.
      // It grows out of its well's bed as it rises and sinks back into it, so it never pops in or out;
      // its top is chamfered, the bevel lit on its own, so the edge catches the light in either scheme.
      const grow = view.ease.standard(clamp(value / 0.42))
      if (grow < 0.004) continue
      const s = half * grow
      const top = 0.35 + 9.9 * value
      const base = -1 * (1 - grow)
      const c0 = small ? 0 : 0.2 * s
      const edge = 0.3 + 0.45 * grow
      const lip = top - c0
      // Sides, up to the bevel.
      set(0, x - s, base, z + s); set(1, x + s, base, z + s); set(2, x + s, lip, z + s); set(3, x - s, lip, z + s)
      quad([0, 0, 1], edge)
      set(0, x + s, base, z - s); set(1, x + s, base, z + s); set(2, x + s, lip, z + s); set(3, x + s, lip, z - s)
      quad([1, 0, 0], edge)
      set(0, x - s, base, z - s); set(1, x - s, base, z + s); set(2, x - s, lip, z + s); set(3, x - s, lip, z - s)
      quad([-1, 0, 0], edge)
      // The top, inset by the bevel, and the four bevels down to the sides.
      const k = s - c0
      set(0, x - k, top, z - k); set(1, x + k, top, z - k); set(2, x + k, top, z + k); set(3, x - k, top, z + k)
      quad([0, 1, 0], edge, 'c1')
      if (c0 > 0) {
        set(0, x - k, top, z + k); set(1, x + k, top, z + k); set(2, x + s, lip, z + s); set(3, x - s, lip, z + s)
        quad([0, 1, 1], 0)
        set(0, x + k, top, z - k); set(1, x + k, top, z + k); set(2, x + s, lip, z + s); set(3, x + s, lip, z - s)
        quad([1, 1, 0], 0)
        set(0, x - k, top, z - k); set(1, x - k, top, z + k); set(2, x - s, lip, z + s); set(3, x - s, lip, z - s)
        quad([-1, 1, 0], 0)
        set(0, x - k, top, z - k); set(1, x + k, top, z - k); set(2, x + s, lip, z - s); set(3, x - s, lip, z - s)
        quad([0, 1, -1], 0)
      }
    }
    // A travelling write line spans the row currently being recomputed.
    // It withdraws at the end of every row rather than jumping visibly.
    for (let r = 0; r < rows; r++) for (const pass of [0, 1]) {
      const window = (pass === 0 ? 0.48 : 0.4) / rows
      const start = (pass === 0 ? 0.04 : 0.56) + r * window
      const progress = span(t, start, start + window)
      const shown = Math.sin(Math.PI * progress) ** 2
      const x = cellX(0) - half + (cellX(cols - 1) - cellX(0) + 2 * half) * view.ease.standard(progress)
      project(x - 3, 0.3, cellZ(r) + half + 2.5, p)
      project(x + 3, 0.3, cellZ(r) + half + 2.5, q)
      depth.line(p, q, hair * 1.4, shown, 'accent')
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A binary grid recomputes successive exclusive-or generations with a staged write pass. */
export function LoaderParity(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
