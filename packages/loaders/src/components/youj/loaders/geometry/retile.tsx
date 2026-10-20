'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, lambert, mix, orient, span, TAU, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'retile', title: 'Retile', category: 'geometry', technique: 'lines',
  tags: ['triangulation', 'edge flip', 'mesh', 'legalization', 'rendering', 'optimization'],
  description: 'A mesh legalizes its diagonals one quadrilateral at a time. Each long edge contracts to its crossing, the alternate edge opens into place, and the two new facets settle; circumcircle witnesses inspect the exchange before the mesh restores its original connectivity.',
  order: 49,
  colors: [{ part: 'Flip', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
// Geometry and legality are calculated once. A diagonal is legal precisely
// when the opposite corner lies outside its triangle's circumcircle.
function circle(a: V3, b: V3, c: V3) {
  const [ax, , az] = a, [bx, , bz] = b, [cx, , cz] = c
  const d = 2 * (ax * (bz - cz) + bx * (cz - az) + cx * (az - bz))
  const aa = ax * ax + az * az, bb = bx * bx + bz * bz, cc = cx * cx + cz * cz
  const x = (aa * (bz - cz) + bb * (cz - az) + cc * (az - bz)) / d
  const z = (aa * (cx - bx) + bb * (ax - cx) + cc * (bx - ax)) / d
  return { x, z, r: Math.hypot(x - ax, z - az) }
}
const LEVELS = [[2, 1], [2, 2], [3, 2]].map(([cols = 2, rows = 2]) => {
  const vertices: V3[] = []
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
    const x = -31 + c * 62 / cols + (r === 1 ? 4 : 0)
    const z = -24 + r * 48 / rows + (c % 2 ? -4 : 0)
    vertices.push([x, 2 + 4 * Math.cos(x * 0.055) * Math.cos(z * 0.07), z])
  }
  const cells = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const corners = [vertices[r * (cols + 1) + c]!, vertices[r * (cols + 1) + c + 1]!, vertices[(r + 1) * (cols + 1) + c + 1]!, vertices[(r + 1) * (cols + 1) + c]!] as [V3, V3, V3, V3]
    const test = circle(corners[0], corners[1], corners[2])
    const legal = Math.hypot(corners[3][0] - test.x, corners[3][2] - test.z) >= test.r ? 0 : 1
    const witness = legal ? test : circle(corners[1], corners[2], corners[3])
    const [a, b, c0, d] = corners
    const ux = c0[0] - a[0], uz = c0[2] - a[2], vx = d[0] - b[0], vz = d[2] - b[2]
    const det = ux * vz - uz * vx
    const s = ((b[0] - a[0]) * vz - (b[2] - a[2]) * vx) / det
    const fraction = ((b[0] - a[0]) * uz - (b[2] - a[2]) * ux) / det
    const center: V3 = [mix(a[0], c0[0], s), (mix(a[1], c0[1], s) + mix(b[1], d[1], fraction)) / 2, mix(a[2], c0[2], s)]
    const triangles = [0, 1].map(diagonal => [1, 3].map(side => {
      const a = corners[diagonal]!, b = corners[diagonal + 2]!, v = corners[(diagonal + side) % 4]!
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
      const vx = v[0] - a[0], vy = v[1] - a[1], vz = v[2] - a[2]
      const sign = uz * vx - ux * vz < 0 ? -1 : 1
      return { corners: [a, b, v], normal: [sign * (uy * vz - uz * vy), sign * (uz * vx - ux * vz), sign * (ux * vy - uy * vx)] as V3 }
    }))
    cells.push({ corners, center, legal, witness, triangles })
  }
  return { vertices, cells }
})
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6, still: 0.405,
  draw(pen, t, view) {
    const small = view.size < 32
    const { vertices, cells } = LEVELS[small ? 0 : view.size < 80 ? 1 : 2]!
    const pose = { yaw: -0.24, pitch: -0.91 }
    const project = camera({ ...pose, distance: 280, cx: view.w / 2, cy: 53 })
    const turn = orient(pose)
    const hair = (small ? 1.05 : 1) / view.px

    cells.forEach(({ corners, center, legal, witness, triangles }, i) => {
      const start = 0.04 + i * 0.3 / (cells.length - 1)
      const restore = 0.72 + (cells.length - i - 1) * 0.11 / (cells.length - 1)
      const g = view.ease.emphasized(span(t, start, start + 0.17)) - view.ease.emphasized(span(t, restore, restore + 0.13))
      const busy = Math.sin(Math.PI * g) ** 2
      const lift = busy * 7
      const diagonal = g < 0.5 ? 1 - legal : legal
      const extent = Math.abs(2 * g - 1)
      const a = corners[diagonal]!, b = corners[diagonal + 2]!
      // Each pair of triangles has its own world normal: a subtly buckled
      // patch really changes its lighting when the connectivity changes.
      for (const triangle of triangles[diagonal]!) {
        const n = turn(...triangle.normal)
        xy.length = 0
        let z = 0
        for (const vertex of triangle.corners) { project(vertex[0], vertex[1], vertex[2], p); xy.push(p.x, p.y); z += p.z / 3 }
        depth.poly(xy, -200 + z * 0.01, 0.035 + 0.09 * lambert(...n))
      }
      xy.length = 0
      let z = 0
      for (const v of corners) { project(...v, p); xy.push(p.x, p.y); z += p.z / 4 }
      depth.path(xy, z, { width: hair * 0.85, alpha: 0.42 + 0.32 * g, closed: true })
      project(mix(center[0], a[0], extent), mix(center[1], a[1], extent) + lift, mix(center[2], a[2], extent), p)
      project(mix(center[0], b[0], extent), mix(center[1], b[1], extent) + lift, mix(center[2], b[2], extent), q)
      depth.line(p, q, hair * 1.2, 0.82)
      // The exchanging edge lifts out of the skin, with witnesses at both
      // ends. Only a short middle segment carries the accent.
      if (busy > 0.004) {
        const mid = clamp(extent * 0.24, 0.06, 0.24)
        project(mix(center[0], a[0], mid), center[1] + lift + 0.2, mix(center[2], a[2], mid), p)
        project(mix(center[0], b[0], mid), center[1] + lift + 0.2, mix(center[2], b[2], mid), q)
        depth.line(p, q, hair * 1.5, busy, 'accent')
        if (!small) for (const v of [a, b]) {
          project(...v, p); project(v[0], v[1] + lift, v[2], q)
          depth.line(p, q, hair * 0.65, busy * 0.3, 'c1')
        }
      }
      if (view.size >= 80 && busy > 0.01) {
        xy.length = 0
        for (let j = 0; j <= 40; j++) {
          const angle = TAU * j / 40
          project(witness.x + witness.r * Math.cos(angle), center[1] + 0.2, witness.z + witness.r * Math.sin(angle), p)
          xy.push(p.x, p.y)
        }
        depth.path(xy, -150, { width: hair * 0.75, alpha: busy * 0.22, closed: true, tone: 'c1' })
      }
    })
    for (const v of vertices) { project(...v, p); p.z += 0.3; depth.dot(p, (small ? 0.8 : 1.2) * hair, 0.88) }
    depth.flush(pen)
  },
}
/* Color: the quadrilateral being legalized, its outline and lift witnesses,
 * is drawn in `c1` while it works; the flipping edge stays the
 * accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Circumcircle-tested diagonal exchanges legalize a faceted mesh. */
export function LoaderRetile(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
