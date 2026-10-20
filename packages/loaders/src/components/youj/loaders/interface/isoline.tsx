'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { rule, window } from './computing'

export const meta = {
  id: 'isoline', title: 'Isoline', category: 'interface', technique: 'lines',
  tags: ['contour', 'marching squares', 'map', 'scalar field', 'interpolation', 'extraction'],
  description: 'A survey window reads a scalar field cell by cell. Interpolated edge crossings join into a continuous contour behind it; the completed boundary lifts clear of the sample grid before the survey unwrites along its original route.',
  order: 34,
  colors: [{ part: 'Contour', mono: 'ink' }],
} satisfies LoaderMeta

type V2 = [number, number]
const scalar = (x: number, y: number) => (x / 24) ** 2 + (y / 21) ** 2 + 0.28 * Math.sin(x * 0.12) * Math.cos(y * 0.11) - 0.72
const FIELDS = [3, 4, 6].map((n) => {
  const size = 56 / n
  const cells = Array.from({ length: n * n }, (_, i) => {
    const row = Math.floor(i / n), col = i % n
    const x = -28 + col * size, y = 28 - row * size
    const corners: V2[] = [[x, y], [x + size, y], [x + size, y - size], [x, y - size]]
    const values = corners.map(([xx, yy]) => scalar(xx, yy))
    const crossings: V2[] = []
    for (let j = 0; j < 4; j++) {
      const next = (j + 1) % 4
      if ((values[j]! < 0) === (values[next]! < 0)) continue
      const f = values[j]! / (values[j]! - values[next]!)
      crossings.push([mix(corners[j]![0], corners[next]![0], f), mix(corners[j]![1], corners[next]![1], f)])
    }
    const segments: [V2, V2][] = []
    // The smooth field has no saddle cells; this pairing also retains all
    // crossings if a lower-detail sample happens to produce four of them.
    for (let j = 0; j + 1 < crossings.length; j += 2) segments.push([crossings[j]!, crossings[j + 1]!])
    return { x: x + size / 2, y: y - size / 2, row, col, order: row * n + (row % 2 ? n - 1 - col : col), values, segments }
  })
  return { n, size, cells, route: [...cells].sort((a, b) => a.order - b.order) }
})
const depth = new Depth()

export const scene: Scene = {
  beats: 6.2, still: 0.6,
  draw(pen, t, view) {
    const small = view.size < 32
    const { n, size, cells, route } = FIELDS[small ? 0 : view.size < 80 ? 1 : 2]!
    const hair = (small ? 1.05 : 1) / view.px
    const project = camera({ yaw: -0.27, pitch: -0.55, distance: 300, cx: 50, cy: 51 })
    const write = (span(t, 0.04, 0.57) - span(t, 0.74, 0.97)) * cells.length
    const head = Math.min(cells.length - 1, Math.floor(Math.max(0, write)))
    const current = route[head]!, previous = route[Math.max(0, head - 1)]!
    const fraction = write - head
    const travel = view.ease.emphasized(span(fraction, 0, 0.23))
    const x = mix(previous.x, current.x, travel), y = mix(previous.y, current.y, travel)
    const lift = 7 * view.ease.standard(span(t, 0.59, 0.68)) * (1 - view.ease.standard(span(t, 0.69, 0.74)))
    for (let j = 0; j <= n; j++) {
      const s = -28 + j * size
      rule(depth, project, -28, s, -1, 28, s, -1, hair * 0.65, 0.22)
      rule(depth, project, s, -28, -1, s, 28, -1, hair * 0.65, 0.22)
    }
    cells.forEach((cell) => {
      const done = view.ease.standard(span(write - cell.order, 0.23, 1))
      if (!small) {
        // A small corner bracket encodes the local sign without making
        // samples into particles or tinting the entire drawing.
        cell.values.forEach((value, j) => {
          const xx = cell.x + (j === 0 || j === 3 ? -1 : 1) * size * 0.32
          const yy = cell.y + (j < 2 ? 1 : -1) * size * 0.32
          rule(depth, project, xx - 0.7, yy, -0.5, xx + 0.7, yy, -0.5, hair * 0.7, value < 0 ? 0.58 : 0.16)
        })
      }
      for (const [a, b] of cell.segments) {
        rule(depth, project, ...a, 0, ...b, 0, hair * 0.9, 0.16)
        if (done <= 0.004) continue
        rule(depth, project, ...a, 0.7 + lift, mix(a[0], b[0], done), mix(a[1], b[1], done), 0.7 + lift, hair * (small ? 1.5 : 1.65), 0.96, 'c1')
      }
    })
    const show = view.ease.enter(span(t, 0.01, 0.06)) * (1 - view.ease.exit(span(t, 0.6, 0.68)))
    if (show > 0.004) {
      window(depth, project, x, y, 6, size * 0.94, size * 0.94, hair, show * 0.75, -1)
      const active = current.segments[0]
      if (active) {
        const [a, b] = active
        rule(depth, project, ...a, 6.1, mix(a[0], b[0], clamp(fraction)), mix(a[1], b[1], clamp(fraction)), 6.1, hair * 1.5, show, 'accent')
      }
    }
    // The elevated finished contour stays tethered to the measured field.
    if (!small && lift > 0.01) for (const cell of cells) for (const [a] of cell.segments) rule(depth, project, ...a, 0.7, ...a, 0.7 + lift, hair * 0.5, 0.18)
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Exact scalar edge crossings join into a surveyed contour and lift off their field.
 *
 * Color: the contour is drawn in `c1` as each cell is solved, and lifts in it; the field and its samples keep the ink, the cell being solved the accent. */
export function LoaderIsoline(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
