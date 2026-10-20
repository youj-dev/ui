'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, lambert, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { fitDash } from './drafting'

export const meta = {
  id: 'facet',
  title: 'Facet',
  category: 'geometry',
  technique: 'planes',
  tags: ['polyhedron', 'cube', 'octahedron', 'cuboctahedron', 'truncate', 'faceted', 'solid'],
  description:
    'A cube cuts its corners in steps, through the cuboctahedron to the octahedron and back, every face lit by where it points; the facet cut into the near corner is edged in the accent.',
  order: 12,
  colors: [{ part: 'Cuts', mono: 'ink' }],
} satisfies LoaderMeta

/* The solid where a cube and an octahedron overlap: |x|, |y|, |z| ≤ 1 and
 * |x| + |y| + |z| ≤ s. At s = 3 it's the cube; lowering s cuts its corners,
 * small triangles growing as the squares shrink, until at s = 2 the two
 * meet as the cuboctahedron, and at s = 1 the squares are gone: the
 * octahedron. It steps there and back, a stop at each (`emphasized`, a
 * landing at every stop), held to one size, and sways a little. Each face
 * is lit by its normal; the triangle cut into the corner nearest the eye is
 * edged in the accent, from the moment it appears.
 *
 * Color: a face being cut in is edged in `c1` and settles to the
 * ink as it grows, and the ghost of the cut corner is dashed in it; the
 * newest face stays the accent. */

type V3 = [number, number, number]

const R = 35
const YAW = -Math.PI / 4
const PITCH = -0.52
const R3 = 1 / Math.sqrt(3)

/** The fourteen planes: the cube's six faces, then the octahedron's eight. */
const PLANES: { n: V3; cube: boolean }[] = [
  ...([
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ] as V3[]).map((n) => ({ n, cube: true })),
  ...[1, -1].flatMap((x) => [1, -1].flatMap((y) => [1, -1].map((z) => ({ n: [x * R3, y * R3, z * R3] as V3, cube: false })))),
]
const ACCENT = PLANES.findIndex((p) => !p.cube && p.n[0] > 0 && p.n[1] > 0 && p.n[2] > 0)

/** A large square on each plane, to clip down to its face: center, and two directions along the plane. */
const SEEDS = PLANES.map(({ n }) => {
  const up: V3 = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]
  const u: V3 = [n[1] * up[2] - n[2] * up[1], n[2] * up[0] - n[0] * up[2], n[0] * up[1] - n[1] * up[0]]
  const lu = Math.hypot(...u)
  const uu: V3 = [u[0] / lu, u[1] / lu, u[2] / lu]
  const v: V3 = [n[1] * uu[2] - n[2] * uu[1], n[2] * uu[0] - n[0] * uu[2], n[0] * uu[1] - n[1] * uu[0]]
  return { u: uu, v }
})

/** A convex polygon cut by the half-space n · p ≤ d. */
function cut(poly: V3[], n: V3, d: number): V3[] {
  const out: V3[] = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!
    const b = poly[(i + 1) % poly.length]!
    const da = n[0] * a[0] + n[1] * a[1] + n[2] * a[2] - d
    const db = n[0] * b[0] + n[1] * b[1] + n[2] * b[2] - d
    if (da <= 0) out.push(a)
    if (da * db < 0) {
      const s = da / (da - db)
      out.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s])
    }
  }
  return out
}

/** The convex hull of flat [x, y, …] points, counter-clockwise on screen (Andrew's monotone chain). */
function convexHull(xy: readonly number[]): number[] {
  const pts: [number, number][] = []
  for (let i = 0; i < xy.length; i += 2) pts.push([xy[i]!, xy[i + 1]!])
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (pts.length < 3) return []
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: [number, number][] = []
  for (const pt of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, pt) <= 0) lower.pop()
    lower.push(pt)
  }
  const upper: [number, number][] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const pt = pts[i]!
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, pt) <= 0) upper.pop()
    upper.push(pt)
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)].flat()
}

const depth = new Depth()
const p = point()
const q = point()
const hull: number[] = []

export const scene: Scene = {
  beats: 6.5,
  still: 0.2,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = 1 / view.px
    const line = (small ? 1.25 : view.size < 80 ? 1.25 : 1.4) / view.px
    const dash = clamp(view.size * 0.016, 2, 4) / view.px
    // Cube, cuboctahedron, octahedron, cuboctahedron, cube: four steps, each landing.
    const step = (a: number) => view.ease.emphasized(span(t, a, a + 0.2))
    const s = 3 - step(0.03) - step(0.27) + step(0.51) + step(0.75)
    // Held to one size: scaled by the distance to its farthest corner.
    const reach = s >= 2 ? Math.sqrt(2 + (s - 2) ** 2) : Math.sqrt(1 + (s - 1) ** 2)
    const k = R / reach
    const yaw = YAW + 0.3 * Math.sin(TAU * t)
    const project = camera({ yaw, pitch: PITCH, distance: 300, cx: view.w / 2, cy: view.h / 2 })
    const turn = orient({ yaw, pitch: PITCH })

    hull.length = 0
    PLANES.forEach(({ n, cube }, i) => {
      const [nx, ny, nz] = turn(...n)
      if (nz <= 0.001) return
      const d = cube ? 1 : s * R3
      const { u, v } = SEEDS[i]!
      const c: V3 = [n[0] * d, n[1] * d, n[2] * d]
      let poly: V3[] = [
        [c[0] + 4 * (u[0] + v[0]), c[1] + 4 * (u[1] + v[1]), c[2] + 4 * (u[2] + v[2])],
        [c[0] + 4 * (u[0] - v[0]), c[1] + 4 * (u[1] - v[1]), c[2] + 4 * (u[2] - v[2])],
        [c[0] - 4 * (u[0] + v[0]), c[1] - 4 * (u[1] + v[1]), c[2] - 4 * (u[2] + v[2])],
        [c[0] - 4 * (u[0] - v[0]), c[1] - 4 * (u[1] - v[1]), c[2] - 4 * (u[2] - v[2])],
      ]
      for (let j = 0; j < PLANES.length && poly.length >= 3; j++) {
        if (j === i) continue
        const other = PLANES[j]!
        poly = cut(poly, other.n, other.cube ? 1 : s * R3)
      }
      if (poly.length < 3) return
      const xy: number[] = []
      let area = 0
      for (const pt of poly) {
        project(pt[0] * k, pt[1] * k, pt[2] * k, p)
        xy.push(p.x, p.y)
        hull.push(p.x, p.y)
      }
      for (let m = 0; m < xy.length; m += 2) {
        const m2 = (m + 2) % xy.length
        area += xy[m]! * xy[m2 + 1]! - xy[m2]! * xy[m + 1]!
      }
      // A face being cut in (a corner just starting, an edge just closing) is a sliver: its edges come in
      // with its size (about 8 px square), so it grows rather than appears.
      const grown = clamp(Math.abs(area) / 2 / (8 / (view.px * view.px)))
      // Front faces of a convex solid never overlap, so any fixed order will do: by plane, which no sway can reorder.
      const accent = i === ACCENT
      depth.face(xy, i, lambert(nx, ny, nz))
      if (accent) {
        depth.path(xy, i + 0.5, { width: (small ? 1.25 : 1.6) / view.px, alpha: grown, closed: true, join: 'miter', tone: 'accent' })
        // The corner it was cut from, ghosted: dashed back along the cube's edges to where the corner stood.
        if (view.size >= 64 && s > 2) {
          const ghost = 0.34 * grown * clamp((s - 2) / 0.25)
          project(k, k, k, q)
          for (let m = 0; m < xy.length; m += 2) {
            const len = Math.hypot(q.x - xy[m]!, q.y - xy[m + 1]!)
            depth.path([xy[m]!, xy[m + 1]!, q.x, q.y], 20, { width: hair, alpha: ghost, dash: fitDash(len, dash), tone: 'c1' })
          }
        }
      } else if (!small) depth.path(xy, i, { width: hair, alpha: 0.35 * grown, closed: true, join: 'miter', tone: blend('c1', 'ink', grown) })
    })

    // The silhouette, heavier than the edges inside it: a convex solid's outline is the hull of what's in front.
    const outline = convexHull(hull)
    if (outline.length >= 6) depth.path(outline, 15, { width: line, alpha: small ? 0.6 : 0.8, closed: true, join: 'bevel' })
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A cube cuts its corners through the cuboctahedron to the octahedron and back, lit facet by facet. */
export function LoaderFacet(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
