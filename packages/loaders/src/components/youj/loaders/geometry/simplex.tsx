'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, lambert, mix, orient, point, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'simplex', title: 'Simplex', category: 'geometry', technique: 'lines',
  tags: ['tetrahedron', 'volume', 'meshing', 'triangulation', 'insertion', 'structure'],
  description: 'An irregular tetrahedral cell receives an interior sample. The sample rises from its barycentric foot, spokes connect it to all four vertices, and a sectional face opens to expose the four child volumes before the cell recombines.',
  order: 42,
  colors: [{ part: 'Spokes', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
const VERTICES: V3[] = [[-25, -20, -16], [25, -17, -12], [-3, -18, 27], [2, 30, -4]]
const CENTER: V3 = [0, 0, 0]
for (const v of VERTICES) for (let axis = 0; axis < 3; axis++) CENTER[axis] = CENTER[axis]! + v[axis]! / 4
const FACES = [[0, 1, 2], [0, 3, 1], [1, 3, 2], [2, 3, 0]].map((ids) => {
  const a = VERTICES[ids[0]!]!, b = VERTICES[ids[1]!]!, c = VERTICES[ids[2]!]!
  const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  const normal: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const len = Math.hypot(...normal)
  const outward = normal[0] * (a[0] - CENTER[0]) + normal[1] * (a[1] - CENTER[1]) + normal[2] * (a[2] - CENTER[2]) > 0 ? 1 : -1
  for (let axis = 0; axis < 3; axis++) normal[axis] = normal[axis]! * outward / len
  return { ids, normal }
})
const EDGES = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]] as const
const depth = new Depth()
const p = point(), q = point()
const triangle = Array.from({ length: 3 }, point)
const xy: number[] = []

export const scene: Scene = {
  beats: 5.8, still: 0.53,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.1 : 1.15) / view.px
    const pose = { yaw: 0.46, pitch: -0.37 }
    const project = camera({ ...pose, distance: 330, cx: 50, cy: 51 })
    const turn = orient(pose)
    const opening = view.ease.emphasized(span(t, 0.18, 0.38)) * (1 - view.ease.emphasized(span(t, 0.7, 0.85)))
    const insert = view.ease.enter(span(t, 0.07, 0.23)) * (1 - view.ease.exit(span(t, 0.83, 0.96)))
    const y = mix(-19, CENTER[1], insert)
    // A cut face parts along its true outward normal, rather than scaling
    // the whole tetrahedron. All other vertices remain registered in space.
    FACES.forEach(({ ids, normal }, f) => {
      const n = turn(...normal)
      if (n[2] <= 0) return
      const move = f === 3 ? 11 * opening : 0
      let z = 0
      xy.length = 0
      ids.forEach((id, j) => {
        const v = VERTICES[id]!
        project(v[0] + normal[0] * move, v[1] + normal[1] * move, v[2] + normal[2] * move, triangle[j]!)
        xy.push(triangle[j]!.x, triangle[j]!.y); z += triangle[j]!.z / 3
      })
      depth.path(xy, z + 0.02, { width: hair * 0.75, alpha: 0.25 + opening * 0.3, closed: true })
      if (f === 3 && !small) ids.forEach((id, j) => {
        project(...VERTICES[id]!, p)
        depth.line(p, triangle[j]!, hair * 0.6, opening * 0.22)
      })
    })
    for (const [a, b] of EDGES) {
      project(...VERTICES[a]!, p); project(...VERTICES[b]!, q)
      depth.line(p, q, hair * (p.k + q.k) / 2, clamp(0.65 + (p.z + q.z) / 150, 0.3, 0.9))
    }
    VERTICES.forEach((v, i) => {
      const from = 0.22 + i * 0.055
      const k = clamp(view.ease.standard(span(t, from, from + 0.12)) - view.ease.standard(span(t, 0.65 + (3 - i) * 0.04, 0.77 + (3 - i) * 0.04)))
      if (k <= 0.004) return
      project(CENTER[0], y, CENTER[2], p)
      project(mix(CENTER[0], v[0], k), mix(y, v[1], k), mix(CENTER[2], v[2], k), q)
      depth.line(p, q, hair * 1.15, k * 0.9, i === 3 ? 'accent' : 'c1')
    })
    // One triangular section reveals the four-child partition's interior.
    const section = view.ease.standard(span(t, 0.43, 0.52)) * (1 - view.ease.standard(span(t, 0.59, 0.67)))
    if (section > 0.003 && !small) {
      const a = VERTICES[0]!, b = VERTICES[3]!
      project(mix(CENTER[0], a[0], section), mix(y, a[1], section), mix(CENTER[2], a[2], section), triangle[0]!)
      project(mix(CENTER[0], b[0], section), mix(y, b[1], section), mix(CENTER[2], b[2], section), triangle[1]!)
      project(CENTER[0], y, CENTER[2], triangle[2]!)
      xy.length = 0
      let order = 0
      for (const v of triangle) { xy.push(v.x, v.y); order += v.z / 3 }
      const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
      const v: V3 = [CENTER[0] - a[0], y - a[1], CENTER[2] - a[2]]
      const normal = turn(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
      const sign = normal[2] > 0 ? 1 : -1
      depth.face(xy, order, lambert(normal[0] * sign, normal[1] * sign, normal[2] * sign))
      depth.path(xy, order + 0.02, { width: hair * 0.85, alpha: section * lambert(...normal), closed: true })
    }
    // The inserted sample is a three-axis witness, not a loose particle.
    if (insert > 0.004) for (let axis = 0; axis < (small ? 2 : 3); axis++) {
      const radius = 2.4 * insert
      project(CENTER[0] - (axis === 0 ? radius : 0), y - (axis === 1 ? radius : 0), CENTER[2] - (axis === 2 ? radius : 0), p)
      project(CENTER[0] + (axis === 0 ? radius : 0), y + (axis === 1 ? radius : 0), CENTER[2] + (axis === 2 ? radius : 0), q)
      depth.line(p, q, hair, insert * 0.95)
    }
    depth.flush(pen)
  },
}
/* Color: the spokes from the sample to the vertices are `c1`; the
 * last spoke stays the accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** An inserted barycentric sample subdivides an irregular tetrahedral volume. */
export function LoaderSimplex(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
