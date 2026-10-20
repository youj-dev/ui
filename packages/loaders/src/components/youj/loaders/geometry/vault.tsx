'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, orient, span, Depth, point, projectPath, type Projected, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { fitDash } from './drafting'

export const meta = {
  id: 'vault', title: 'Vault', category: 'geometry', technique: 'planes',
  tags: ['arch', 'masonry', 'voussoir', 'keystone', 'architecture', 'assembly'],
  description: 'Wedge-shaped stones seat in pairs from the springings toward a final keystone. Extruded inner walls reveal the open arch; a short accent joint closes at the crown before the stones withdraw in reverse order.',
  order: 23,
  colors: [{ part: 'Centering', mono: 'ink' }],
} satisfies LoaderMeta

/* An arch built the way masons build one: on centering. The timber
 * centering (drawn dashed, as temporary works are) stands between the two
 * piers; the voussoirs come in pairs from the springings and seat on it
 * (`emphasized`), each a lit wedge with depth, until the keystone drops in
 * and its joint closes in the accent. Then the centering is struck, lowered
 * away from the finished arch, and set back up under it before the stones
 * withdraw, keystone first. The view sways the whole time.
 *
 * Color: the temporary centering, its rib, sill and props, is dashed in `c1`
 * under the ink stones; the closing joint stays the accent. */

const R_IN = 20
const R_OUT = 30
const SPRING = -10
const FRONT = 5
const BACK = -7

type V3 = [number, number, number]

const depth = new Depth()
const front: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const side: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])
const xy: number[] = []
/** The keystone's two joints, as corners of its front face. */
const JOINTS = [
  [0, 1],
  [3, 2],
] as const
const p = point()
const q = point()

export const scene: Scene = {
  beats: 6,
  still: 0.4,
  draw(pen, t, view) {
    const small = view.size < 32
    const n = small ? 7 : 9
    const hair = (small ? 1.1 : 1.05) / view.px
    const line = 1.3 / view.px
    const dash = clamp(view.size * 0.016, 2, 4) / view.px
    const pose = { yaw: -0.36 + 0.08 * Math.sin(TAU * t), pitch: -0.26 }
    const zoom = small ? 1.12 : 1.08
    const lens = camera({ ...pose, distance: 340, cx: view.w / 2, cy: view.h / 2 })
    const project = (x: number, y: number, z: number, out: Projected) => lens(x * zoom, (y + 2) * zoom, z * zoom, out)
    const turn = orient(pose)
    const last = (n - 1) / 2

    // A lit block from its front face: the walls toward the eye, then the face; returns a depth just in front of it.
    const block = () => {
      for (let j = 0; j < 4; j++) {
        const a = front[j]!
        const b = front[(j + 1) % 4]!
        const normal = turn(b[1] - a[1], a[0] - b[0], 0)
        if (normal[2] <= 0) continue
        for (let k = 0; k < 4; k++) {
          const v = k === 0 || k === 3 ? a : b
          side[k]![0] = v[0]
          side[k]![1] = v[1]
          side[k]![2] = k < 2 ? BACK : FRONT
        }
        const f = projectPath(side, project, xy)
        depth.face(f.xy, f.z, lambert(...normal))
      }
      const f = projectPath(front, project, xy)
      depth.face(f.xy, f.z, lambert(...turn(0, 0, 1)))
      depth.path(f.xy, f.z + 0.03, { width: hair, alpha: 0.7, closed: true })
      return f.z + 0.06
    }

    // The piers, on a ground line.
    for (const sign of [-1, 1]) {
      const x = sign * 25
      const c = [[x - 5, -30], [x + 5, -30], [x + 5, SPRING], [x - 5, SPRING]]
      c.forEach(([xx, y], j) => {
        front[j]![0] = xx!
        front[j]![1] = y!
        front[j]![2] = FRONT
      })
      block()
    }
    if (!small) {
      project(-38, -30, 9, p)
      project(38, -30, 9, q)
      depth.path([p.x, p.y, q.x, q.y], -400, { width: hair, alpha: 0.35 })
    }

    // The centering: up from the start, struck once the keystone is home, and set back before the stones come out.
    const strike = view.ease.emphasized(span(t, 0.5, 0.58)) * (1 - view.ease.emphasized(span(t, 0.58, 0.66)))
    if (!small) {
      const drop = 3.5 * strike
      const alpha = 0.42 * (1 - 0.75 * strike)
      const z = FRONT + 0.5
      xy.length = 0
      for (let i = 0; i <= 24; i++) {
        const a = (Math.PI * i) / 24
        project((R_IN - 0.4) * Math.cos(a), SPRING + (R_IN - 0.4) * Math.sin(a) - drop, z, p)
        xy.push(p.x, p.y)
      }
      depth.path(xy, 200, { width: hair, alpha, dash: [dash, dash * 0.8], tone: 'c1' })
      // Its sill at the springing, and the props from the sill to the rib.
      project(-R_IN, SPRING - drop, z, p)
      project(R_IN, SPRING - drop, z, q)
      depth.path([p.x, p.y, q.x, q.y], 200, { width: hair, alpha, dash: fitDash(Math.hypot(q.x - p.x, q.y - p.y), dash), tone: 'c1' })
      for (const a of [Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4]) {
        const x = (R_IN - 0.4) * Math.cos(a)
        project(x, SPRING - drop, z, p)
        project(x, SPRING + (R_IN - 0.4) * Math.sin(a) - drop, z, q)
        depth.path([p.x, p.y, q.x, q.y], 200, { width: hair, alpha, dash: fitDash(Math.hypot(q.x - p.x, q.y - p.y), dash * 0.8), tone: 'c1' })
      }
    }

    // The voussoirs, in pairs from the springings, the keystone last; out again keystone first.
    for (let i = 0; i < n; i++) {
      const rank = Math.min(i, n - 1 - i)
      const seat = view.ease.emphasized(span(t, 0.04 + rank * 0.06, 0.22 + rank * 0.06)) - view.ease.emphasized(span(t, 0.66 + (last - rank) * 0.035, 0.8 + (last - rank) * 0.035))
      const loose = 1 - seat
      const a = (Math.PI * i) / n + 0.012
      const b = (Math.PI * (i + 1)) / n - 0.012
      const mid = (a + b) / 2
      const cx = ((R_IN + R_OUT) / 2) * Math.cos(mid)
      const cy = SPRING + ((R_IN + R_OUT) / 2) * Math.sin(mid)
      const roll = 0.16 * Math.cos(mid) * loose
      const cs = Math.cos(roll)
      const sn = Math.sin(roll)
      const corners = [[R_IN, a], [R_OUT, a], [R_OUT, b], [R_IN, b]]
      corners.forEach(([r, angle], j) => {
        const x = r! * Math.cos(angle!) - cx
        const y = SPRING + r! * Math.sin(angle!) - cy
        front[j]![0] = cx + x * cs - y * sn + 7 * Math.cos(mid) * loose
        front[j]![1] = cy + x * sn + y * cs + (6 + 4 * Math.sin(mid)) * loose
        front[j]![2] = FRONT
      })
      const layer = block()
      if (i === last) {
        // The accent joint closes at the crown as the keystone seats, and opens as it leaves.
        const shown = view.ease.enter(span(seat, 0.75, 1))
        if (shown > 0.01) {
          for (const [j, k] of JOINTS) {
            project(front[j]![0], front[j]![1], FRONT + 0.1, p)
            project(front[k]![0], front[k]![1], FRONT + 0.1, q)
            depth.path([p.x, p.y, q.x, q.y], layer, { width: line * 1.1, alpha: shown, tone: 'accent' })
          }
        }
      }
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Paired voussoirs lock a deep masonry arch beneath its final keystone. */
export function LoaderVault(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
