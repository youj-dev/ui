'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, lambert, orient, point, projectPath, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { stock } from './fabric'

export const meta = {
  id: 'reciprocal', title: 'Reciprocal', category: 'geometry', technique: 'planes',
  tags: ['roof', 'timber', 'construction', 'reciprocal frame', 'oculus', 'support'],
  description: 'Six sloping rafters erect around an open roof eye, each crossing above its neighbour and carrying the next. A temporary shore holds the first joint until the final rafter closes the support circuit, then drops away; it returns before the roof dismantles.',
  order: 47,
  colors: [{ part: 'Shore', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
const THICK = 3.6
const WIDTH = 4.6
const RADIAL = 110 * Math.PI / 180
const start: V3 = [33, -8, 0]
const end: V3 = [12 * Math.cos(RADIAL), 0, 12 * Math.sin(RADIAL)]
const dx = end[0] - start[0], dz = end[2] - start[2]
const run = Math.hypot(dx, dz)
// Adjacent rotated centerlines cross at these two parameters. Choose the
// rise so their vertical separation equals the beam's projected thickness:
// the inner part really rests on the outer part of its neighbour.
const rotate = (x: number, z: number, a: number): [number, number] => [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)]
const [ax, az] = rotate(start[0], start[2], TAU / 6)
const [bx, bz] = rotate(end[0], end[2], TAU / 6)
const cross = (a: number, b: number, c: number, d: number) => a * d - b * c
const divisor = cross(dx, dz, bx - ax, bz - az)
const upper = cross(ax - start[0], az - start[2], bx - ax, bz - az) / divisor
const lower = cross(ax - start[0], az - start[2], dx, dz) / divisor
const RISE = THICK / Math.sqrt((upper - lower) ** 2 - (THICK / run) ** 2)
const length = Math.hypot(run, RISE)
const U: V3 = [-dz / run, 0, dx / run]
const V: V3 = [-dx * RISE / (run * length), run / length, -dz * RISE / (run * length)]
const L: V3 = [dx / length, RISE / length, dz / length]
const MEMBERS = Array.from({ length: 6 }, (_, i) => {
  const angle = i * TAU / 6
  const [x, z] = rotate(start[0], start[2], angle)
  const turn = (v: V3): V3 => { const [x, z] = rotate(v[0], v[2], angle); return [x, v[1], z] }
  return { a: [x, -8, z] as V3, u: turn(U), v: turn(V), l: turn(L) }
})
const FACES = [
  { ids: [2, 3, 7, 6], axis: 'v', sign: 1 }, { ids: [0, 1, 5, 4], axis: 'v', sign: -1 },
  { ids: [1, 3, 7, 5], axis: 'u', sign: 1 }, { ids: [0, 2, 6, 4], axis: 'u', sign: -1 },
  { ids: [4, 5, 7, 6], axis: 'l', sign: 1 }, { ids: [0, 1, 3, 2], axis: 'l', sign: -1 },
] as const
const depth = new Depth()
const corners = Array.from({ length: 8 }, point)
const xy: number[] = []
const ring: V3[] = MEMBERS.map(({ a }) => [a[0], -23, a[2]])
const p = point(), q = point()
const joint: V3 = [0, 0, 0]

export const scene: Scene = {
  beats: 6, still: 0.65,
  draw(pen, t, view) {
    const small = view.size < 32
    const pose = { yaw: -0.24, pitch: -0.65 }
    const project = camera({ ...pose, distance: 340, cx: view.w / 2, cy: 53 })
    const light = orient(pose)
    const hair = (small ? 1.05 : 1) / view.px
    const supports = view.ease.emphasized(span(t, 0.02, 0.17)) * (1 - view.ease.exit(span(t, 0.9, 0.99)))
    const foundation = projectPath(ring, project, xy)
    depth.path(foundation.xy, -120, { width: hair * 0.75, alpha: 0.3, closed: true, dash: small ? undefined : [2.5 * hair, 2 * hair] })

    MEMBERS.forEach((member, i) => {
      const { a, u, v, l } = member
      stock(depth, project, light, a[0], -23, a[2], 6, 1.8, 6, hair * 0.75)
      const h = 2 + 12 * supports
      stock(depth, project, light, a[0], -22 + h / 2, a[2], 2.8, h, 2.8, hair * 0.75)
      const fit = clamp(view.ease.emphasized(span(t, 0.16 + i * 0.065, 0.3 + i * 0.065)) * (1 - view.ease.exit(span(t, 0.77 + (5 - i) * 0.025, 0.86 + (5 - i) * 0.025))))

      // The ghost is a centerline, not another translucent solid; it
      // continues to show the full support circuit during construction.
      if (!small) {
        project(...a, p)
        project(a[0] + l[0] * length, a[1] + l[1] * length, a[2] + l[2] * length, q)
        depth.path([p.x, p.y, q.x, q.y], -90, { width: hair * 0.6, alpha: 0.14 })
      }
      if (fit <= 0.004) return
      const beamLength = length * fit
      for (let j = 0; j < 8; j++) {
        const w = (j & 1 ? 1 : -1) * WIDTH / 2 * fit
        const h = (j & 2 ? 1 : -1) * THICK / 2 * fit
        const along = j & 4 ? beamLength : 0
        project(a[0] + u[0] * w + v[0] * h + l[0] * along, a[1] + u[1] * w + v[1] * h + l[1] * along, a[2] + u[2] * w + v[2] * h + l[2] * along, corners[j]!)
      }
      for (const face of FACES) {
        const normal = member[face.axis]
        const n = light(normal[0] * face.sign, normal[1] * face.sign, normal[2] * face.sign)
        if (n[2] <= 0) continue
        xy.length = 0
        let z = 0
        for (const j of face.ids) { xy.push(corners[j]!.x, corners[j]!.y); z += corners[j]!.z / 4 }
        depth.face(xy, z, lambert(...n))
        depth.path(xy, z + 0.02, { width: hair * 0.8, alpha: clamp(0.72 + z / 180), closed: true })
      }
      if (!small && fit > 0.8) {
        // A fine grain witness follows the rafter's top, strengthening the
        // length direction without turning the timber into a wire cage.
        const along0 = length * 0.12, along1 = length * fit * 0.88
        project(a[0] + v[0] * (THICK / 2 + 0.08) + l[0] * along0, a[1] + v[1] * (THICK / 2 + 0.08) + l[1] * along0, a[2] + v[2] * (THICK / 2 + 0.08) + l[2] * along0, p)
        project(a[0] + v[0] * (THICK / 2 + 0.08) + l[0] * along1, a[1] + v[1] * (THICK / 2 + 0.08) + l[1] * along1, a[2] + v[2] * (THICK / 2 + 0.08) + l[2] * along1, q)
        depth.line(p, q, hair * 0.55, 0.32)
      }
    })

    // A shore under the first upper crossing is required while the cycle
    // is incomplete. Once all six rafters seat it actually lowers away.
    const brace = view.ease.emphasized(span(t, 0.08, 0.18)) * (1 - view.ease.exit(span(t, 0.64, 0.72))) + view.ease.emphasized(span(t, 0.73, 0.77)) * (1 - view.ease.exit(span(t, 0.9, 0.99)))
    const sx = start[0] + dx * upper, sz = start[2] + dz * upper
    const top = -8 + RISE * upper - THICK * run / length / 2
    const h = 2 + (top + 20) * clamp(brace)
    stock(depth, project, light, sx, -22 + h / 2, sz, small ? 2.2 : 1.8, h, small ? 2.2 : 1.8, hair * 0.7, 'ink', true, 'c1')
    const close = view.ease.standard(span(t, 0.62, 0.68)) * (1 - view.ease.exit(span(t, 0.72, 0.78)))
    const last = MEMBERS[5]!
    // Mark the final rafter's upper contact with the first rafter. Its
    // lower crossing is covered by the neighbour it already carries.
    const along = length * upper
    for (let j = 0; j < 3; j++) joint[j] = last.a[j]! + last.l[j]! * along + last.v[j]! * (THICK / 2 + 0.1)
    project(joint[0] - last.u[0] * WIDTH / 2, joint[1], joint[2] - last.u[2] * WIDTH / 2, p)
    project(joint[0] + last.u[0] * WIDTH / 2, joint[1], joint[2] + last.u[2] * WIDTH / 2, q)
    depth.line(p, q, hair * 1.4, close, 'accent')
    depth.flush(pen)
  },
}
/* Color: the temporary shore holding the first joint is outlined in `c1`
 *, set apart from the rafters it stands under; the closing joint
 * stays the accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Six rafters close a reciprocal support circuit and release their temporary shore. */
export function LoaderReciprocal(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
