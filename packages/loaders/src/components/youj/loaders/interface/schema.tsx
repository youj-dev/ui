'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, lambert, mix, orient, point, projectPath, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { dataPlane } from './data-plane'

export const meta = {
  id: 'schema', title: 'Schema', category: 'interface', technique: 'lines',
  tags: ['tables', 'keys', 'relations', 'database', 'schema', 'indexing'],
  description: 'Three table schemas assemble column by column. Their key columns lift above the records, orthogonal relationship lines connect matching rows, and the keys seat together before the relationships and columns withdraw.',
  order: 22,
  colors: [{ part: 'Relations', mono: 'ink' }],
} satisfies LoaderMeta

const TABLES = [[-22, 19, -5], [23, 2, 1], [-15, -23, 7]] as const
const FRAMES = TABLES.map(([x, y, z]): [number, number, number][] => [[x - 14, y - 11, z], [x + 14, y - 11, z], [x + 14, y + 11, z], [x - 14, y + 11, z]])
const ROUTES = [
  [[-34, 18, 0], [-40, 18, 0], [-40, 37, 0], [35, 37, 6], [35, 4, 6]],
  [[11, -1, 6], [5, -1, 6], [5, -24, 12], [-3, -24, 12]],
] as const
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6, still: 0.53,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.1 : 1) / view.px
    const pose = { yaw: -0.16, pitch: -0.24 }
    const project = camera({ ...pose, distance: 340, cx: view.w / 2 + 2, cy: 51 })
    const light = lambert(...orient(pose)(0, 0, 1))
    const clear = 1 - view.ease.exit(span(t, 0.75, 0.96))
    for (const [i, [x, y, z]] of TABLES.entries()) {
      const frame = projectPath(FRAMES[i]!, project, xy)
      depth.path(frame.xy, frame.z - 0.1, { width: hair * 0.75, alpha: 0.25, closed: true })
      for (let col = 0; col < 3; col++) {
        const seat = clamp(view.ease.emphasized(span(t, 0.03 + i * 0.07 + col * 0.045, 0.17 + i * 0.07 + col * 0.045)) * clear)
        if (seat < 0.005) continue
        const lift = col === 0 ? 4 * Math.sin(Math.PI * span(t, 0.29, 0.74)) ** 2 : 0
        const cx = x + (col - 1) * 8.6
        const zz = z + 7 * (1 - seat) + lift
        const order = dataPlane(depth, project, cx, y + 5 * (1 - seat), zz, 8.2 * seat, 20 * seat, hair * 0.65, light, 0.5 + seat * 0.25)
        const rows = small ? 2 : 4
        for (let row = 0; row < rows; row++) {
          const yy = y + 5 * (1 - seat) + (5.5 - row * (small ? 8 : 4.2)) * seat
          project(cx - 2.1 * seat, yy, zz + 0.1, p); project(cx + 2.1 * seat, yy, zz + 0.1, q)
          depth.path([p.x, p.y, q.x, q.y], order + 0.08, { width: hair * 0.75, alpha: seat * (row === 0 ? 0.82 : 0.42) })
        }
      }
    }
    for (const [i, route] of ROUTES.entries()) {
      const f = projectPath(route, project, xy)
      depth.path(f.xy, f.z + 9, { width: hair * 0.75, alpha: 0.14, join: 'miter' })
      const trace = view.ease.standard(span(t, 0.32 + i * 0.12, 0.52 + i * 0.12))
      const parts = route.length - 1
      for (let j = 0; j < parts; j++) {
        const k = clamp(trace * parts - j)
        if (k <= 0) continue
        const a = route[j]!, b = route[j + 1]!
        project(a[0], a[1], a[2], p); project(mix(a[0], b[0], k), mix(a[1], b[1], k), mix(a[2], b[2], k), q)
        depth.path([p.x, p.y, q.x, q.y], f.z + 10, { width: hair * 1.05, alpha: 0.8 * clear, tone: i === 1 && j === parts - 1 ? 'accent' : 'c1' })
      }
      // Fork terminals identify table relations even when the rows simplify.
      const end = route[parts]!
      const ready = view.ease.standard(span(t, 0.49 + i * 0.12, 0.57 + i * 0.12)) * clear
      for (const d of [-2.5, 0, 2.5]) {
        project(end[0], end[1], end[2], p); project(end[0] - 3, end[1] + d, end[2], q)
        depth.path([p.x, p.y, q.x, q.y], f.z + 11, { width: hair * 0.8, alpha: 0.75 * ready, tone: 'c1' })
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Table columns assemble and matching keys establish two orthogonal relationships.
 *
 * Color: the relations, each traced route between tables and its fork terminal, are `c1`; the tables keep the ink, one relation’s last leg the accent. */
export function LoaderSchema(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
