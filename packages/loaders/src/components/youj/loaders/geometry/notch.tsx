'use client'

import { blend, camera, clamp, lambert, mix, orient, span, Depth, point, type Scene } from '../field'
import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'notch', title: 'Notch', category: 'geometry', technique: 'planes',
  tags: ['triangulation', 'concave', 'plan', 'mesh', 'construction', 'ear'],
  description: 'A concave floor plan triangulates by removing one valid boundary ear at a time. Each accepted diagonal closes before its triangular floor plate seats, a fine inspection fan checks the next corner, and the four plates unseat in reverse order to restore the open plan.',
  order: 53,
  colors: [{ part: 'Diagonals', mono: 'ink' }],
} satisfies LoaderMeta

type V2 = readonly [number, number]
const PLAN: V2[] = [[-31, -25], [31, -25], [31, 2], [6, 2], [6, 26], [-31, 26]]
const PLAN_IDS = PLAN.map((_, i) => i)
const cross = (a: V2, b: V2, c: V2) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
// Compute the actual ear schedule once. No hand-drawn diagonal can cut
// across the reentrant corner or cover a piece of the missing courtyard.
const EARS: { ids: number[]; boundary: number[] }[] = []
const pending = PLAN.map((_, i) => i)
while (pending.length > 3) {
  for (let step = 1; step <= pending.length; step++) {
    const i = step % pending.length
    const ids = [pending[(i + pending.length - 1) % pending.length]!, pending[i]!, pending[(i + 1) % pending.length]!]
    const [a, b, c] = ids.map((id) => PLAN[id]!) as [V2, V2, V2]
    if (cross(a, b, c) <= 0 || pending.some((id) => !ids.includes(id) && cross(a, b, PLAN[id]!) >= 0 && cross(b, c, PLAN[id]!) >= 0 && cross(c, a, PLAN[id]!) >= 0)) continue
    EARS.push({ ids, boundary: [...pending] })
    pending.splice(i, 1)
    break
  }
}
EARS.push({ ids: [...pending], boundary: [...pending] })
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6, still: 0.48,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    const pose = { yaw: -0.35, pitch: -0.87 }
    const project = camera({ ...pose, distance: 430, cx: 50, cy: 53 })
    const turn = orient(pose)
    const boundary = (ids: readonly number[], y: number) => {
      xy.length = 0; let z = 0
      for (const id of ids) { const v = PLAN[id]!; project(v[0], y, v[1], p); xy.push(p.x, p.y); z += p.z / ids.length }
      return z
    }
    boundary(PLAN_IDS, -3)
    // This is a construction drawing beneath every floor plate. Sorting
    // the entire concave sheet by its centroid would hide the far ears.
    depth.poly(xy, -100, 0.025)
    depth.path(xy, -99, { width: hair * 1.15, alpha: 0.7, closed: true })
    for (let i = 0; i < EARS.length; i++) {
      const ear = EARS[i]!, start = 0.04 + i * 0.125
      const release = 1 - view.ease.exit(span(t, 0.75 + (3 - i) * 0.033, 0.86 + (3 - i) * 0.033))
      const diagonal = view.ease.standard(span(t, start, start + 0.095)) * release
      const seat = clamp(view.ease.emphasized(span(t, start + 0.065, start + 0.16))) * release
      const A = PLAN[ear.ids[0]!]!, B = PLAN[ear.ids[2]!]!
      if (diagonal > 0.002) {
        project(A[0], -2, A[1], p); project(mix(A[0], B[0], diagonal), -2, mix(A[1], B[1], diagonal), q)
        depth.line(p, q, hair, 0.75 * diagonal, blend('c1', 'ink', seat))
      }
      if (seat > 0.003) {
        const y = mix(9, 0, seat), scale = mix(0.88, 1, seat)
        const cx = ear.ids.reduce((s, id) => s + PLAN[id]![0] / 3, 0), cz = ear.ids.reduce((s, id) => s + PLAN[id]![1] / 3, 0)
        xy.length = 0; let z = 0
        for (const id of ear.ids) { const v = PLAN[id]!; project(cx + (v[0] - cx) * scale, y, cz + (v[1] - cz) * scale, p); xy.push(p.x, p.y); z += p.z / 3 }
        // The top faces upward, independently of the plan's XZ winding.
        const topLight = lambert(...turn(0, 1, 0)) * (0.88 + 0.035 * i)
        depth.face(xy, z, topLight)
        depth.path(xy, z + 0.04, { width: hair * 0.8, alpha: clamp(0.7 + z / 200, 0.45, 0.85), closed: true })
        // Thin cut returns preserve the plate's depth as it seats.
        for (let k = 0; k < 3; k++) {
          const a = PLAN[ear.ids[k]!]!, b = PLAN[ear.ids[(k + 1) % 3]!]!
          const nx = b[1] - a[1], nz = -(b[0] - a[0]), normal = turn(nx, 0, nz)
          if (normal[2] <= 0) continue
          xy.length = 0; let order = 0
          for (let c = 0; c < 4; c++) {
            const v = c === 0 || c === 3 ? a : b
            project(cx + (v[0] - cx) * scale, y - (c > 1 ? 2.2 : 0), cz + (v[1] - cz) * scale, p)
            xy.push(p.x, p.y); order += p.z / 4
          }
          depth.face(xy, order + 0.02, lambert(...normal))
          if (!small) depth.path(xy, order + 0.06, { width: hair * 0.65, alpha: 0.6, closed: true })
        }
      }
      const inspect = Math.sin(Math.PI * span(t, start, start + 0.12)) * release
      if (inspect > 0.002) {
        const tip = PLAN[ear.ids[1]!]!
        project(tip[0], 11, tip[1], p)
        for (const id of [ear.ids[0]!, ear.ids[2]!]) {
          const v = PLAN[id]!
          project(v[0], 11, v[1], q)
          depth.line(p, q, hair * (small ? 1 : 0.8), inspect * 0.75, 'accent')
        }
        if (!small) for (const id of ear.boundary) {
          if (ear.ids.includes(id)) continue
          const v = PLAN[id]!; project(v[0], 11, v[1], q)
          depth.line(p, q, hair * 0.55, inspect * 0.16)
        }
      }
    }
    depth.flush(pen)
  },
}
/* Color: each accepted diagonal is drawn in `c1` and settles to
 * the ink as its plate seats; the inspected ear stays the accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Boundary ears become a complete concave floor triangulation. */
export function LoaderNotch(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
