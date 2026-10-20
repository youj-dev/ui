'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, hump, lambert, orient, point, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'refract', title: 'Refract', category: 'signal', technique: 'lines',
  tags: ['prism', 'refraction', 'wavefront', 'snell', 'optics', '3d'],
  description: 'A sheet of parallel light crosses both inclined walls of a triangular prism. Its direction changes at each interface according to the same refractive ratio; travelling fronts narrow inside the glass and emerge onto a ruled receiving plane.',
  order: 20,
  colors: [{ part: 'Light fronts', mono: 'ink' }],
} satisfies LoaderMeta

const depth = new Depth()
const p = point(), q = point(), r = point(), s = point()
const TRIANGLE = [[-14, -18], [14, -18], [0, 20]] as const
const ENTRY = -Math.atan2(14, 38), EXIT = -ENTRY
const INDEX = 1.42
const xy: number[] = []

/* Color: the travelling light fronts are `c1`, the rays and the
 * prism stay the ink and the chief front the accent. */

export const scene: Scene = {
  beats: 5, still: 0.32,
  draw(pen, t, view) {
    const small = view.size < 32
    const rows = small ? 3 : 5
    const planes = small ? 1 : view.size < 80 ? 2 : 3
    const hair = clamp(view.size * 0.006, 0.85, 1.25) / view.px
    const pose = { yaw: -0.3, pitch: -0.25 }
    const project = camera({ ...pose, distance: 360, cx: view.w / 2, cy: 49 })
    const turn = orient(pose)
    const incident = -0.1 + 0.18 * view.ease.standard(hump(t))
    const inside = ENTRY + Math.asin(Math.sin(incident - ENTRY) / INDEX)
    const outside = EXIT + Math.asin(INDEX * Math.sin(inside - EXIT))
    // Opaque narrow prism walls, a clear front: the beam remains visible inside.
    for (let i = 0; i < 3; i++) {
      const a = TRIANGLE[i]!, b = TRIANGLE[(i + 1) % 3]!
      const n = turn(b[1] - a[1], a[0] - b[0], 0)
      if (n[2] <= 0) continue
      project(a[0], a[1], -9, p); project(b[0], b[1], -9, q)
      project(b[0], b[1], 9, r); project(a[0], a[1], 9, s)
      depth.face([p.x, p.y, q.x, q.y, r.x, r.y, s.x, s.y], (p.z + q.z + r.z + s.z) / 4, lambert(...n) * 0.6)
    }
    for (const z of [-9, 9]) {
      xy.length = 0
      let layer = 0
      for (const [x, y] of TRIANGLE) { project(x, y, z, p); xy.push(p.x, p.y); layer += p.z / 3 }
      if (z > 0) depth.poly(xy, layer, 0.045)
      depth.path(xy, layer + 0.01, { width: hair, alpha: z < 0 ? 0.25 : 0.85, closed: true })
    }
    // Coordinates from exact line/plane intersections, no detached beam segments.
    for (let plane = 0; plane < planes; plane++) {
      const z = planes === 1 ? 2 : -5 + plane * 10 / (planes - 1)
      for (let row = 0; row < rows; row++) {
        const y0 = -7 + 14 * row / (rows - 1)
        const dx = Math.cos(incident), dy = Math.sin(incident)
        // The incoming origin is x=-14; entry equation is 38x-14y=-280.
        const correction = (-280 - (38 * -14 - 14 * y0)) / (38 * dx - 14 * dy)
        const ex = -14 + correction * dx, ey = y0 + correction * dy
        const ix = Math.cos(inside), iy = Math.sin(inside)
        const len = (280 - 38 * ex - 14 * ey) / (38 * ix + 14 * iy)
        const ox = ex + len * ix, oy = ey + len * iy
        const startY = ey + (-36 - ex) * Math.tan(incident)
        const endY = oy + (36 - ox) * Math.tan(outside)
        const segments = [[-36, startY, ex, ey], [ex, ey, ox, oy], [ox, oy, 36, endY]]
        for (let segment = 0; segment < 3; segment++) {
          const [ax, ay, bx, by] = segments[segment]!
          project(ax!, ay!, z, p); project(bx!, by!, z, q)
          depth.line(p, q, hair * 0.75 * p.k, plane === planes - 1 ? 0.48 : 0.23)
          const phase = (t + 1 - segment / 3) % 1
          const u = view.ease.standard(phase)
          const du = segment === 1 ? 0.045 : 0.09
          const a = clamp(u - du), b = clamp(u + du)
          project(ax! + (bx! - ax!) * a, ay! + (by! - ay!) * a, z + 0.2, p)
          project(ax! + (bx! - ax!) * b, ay! + (by! - ay!) * b, z + 0.2, q)
          depth.line(p, q, hair * 1.35 * p.k, Math.sin(Math.PI * phase), row === Math.floor(rows / 2) && plane === planes - 1 ? 'accent' : 'c1')
        }
        // Tick at the actual hit height on the receiving screen.
        project(36, endY, z - 1.3, p); project(36, endY, z + 1.3, q)
        depth.line(p, q, hair, 0.7)
      }
    }
    for (const z of [-10, 10]) {
      project(36, -28, z, p); project(36, 15, z, q)
      depth.line(p, q, hair, 0.35)
    }
    project(36, -28, -10, p); project(36, -28, 10, q)
    depth.line(p, q, hair, 0.4)
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** A prism refracts parallel ray sheets onto a receiving plane. */
export function LoaderRefract(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
