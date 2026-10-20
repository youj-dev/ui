'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, mix, span, Depth, point, projectPath, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'refine', title: 'Refine', category: 'interface', technique: 'lines',
  tags: ['mesh', 'triangulation', 'adaptive', 'subdivision', 'resolution', 'focus'],
  description: 'A coarse triangulated patch refines around two inspection windows. Each triangle splits at its centroid only after its parent has settled, new spokes grow into the fine mesh, and the windows exchange resolution before the subdivisions withdraw.',
  order: 14,
  colors: [{ part: 'Refinement', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
interface Triangle { corners: [V3, V3, V3]; center: V3; level: number; bank: number; rank: number; of: number }
const triangles: Triangle[] = []
const split = (corners: [V3, V3, V3], level: number, bank: number) => {
  const center: V3 = [0, 0, 0]
  for (const c of corners) { center[0] += c[0] / 3; center[1] += c[1] / 3; center[2] += c[2] / 3 }
  triangles.push({ corners, center, level, bank, rank: 0, of: 1 })
  if (level >= 2) return
  for (let i = 0; i < 3; i++) split([corners[i]!, corners[(i + 1) % 3]!, center], level + 1, bank)
}
const A: V3 = [-31, 0, -28], B: V3 = [31, 0, -28], C: V3 = [31, 0, 28], D: V3 = [-31, 0, 28], O: V3 = [0, 0, 0]
for (const [corners, bank] of [[[A, B, O], 0], [[B, C, O], 1], [[C, D, O], 1], [[D, A, O], 0]] as [[V3, V3, V3], number][]) split(corners, 0, bank)
// Within a bank and level, the triangles refine one after another across the patch, a ripple rather than all at once.
for (const tri of triangles) {
  const group = triangles.filter((other) => other.bank === tri.bank && other.level === tri.level).sort((m, n) => m.center[0] + m.center[2] - n.center[0] - n.center[2])
  tri.rank = group.indexOf(tri)
  tri.of = group.length
}
const depth = new Depth()
const p = point(), q = point()
const xy: number[] = []
const inspection: V3[] = Array.from({ length: 4 }, () => [0, 0, 0])

export const scene: Scene = {
  beats: 6, still: 0.39,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    // A slow sway keeps the patch alive between its refinements; none when tiny, where it would only shimmer.
    const project = camera({ yaw: -0.24 + (small ? 0 : 0.04 * Math.sin(TAU * t)), pitch: -0.85, distance: 300, cx: view.w / 2, cy: 49 })
    const knots = view.size >= 40
    const knot = (v: V3, side: number, alpha: number, tone: Tone = 'ink') => { project(...v, p); depth.square({ x: p.x, y: p.y, z: p.z + 0.5, k: 1 }, side, alpha, tone) }
    const rim = projectPath([A, B, C, D], project, xy)
    depth.poly(rim.xy, rim.z - 0.1, 0.025)
    depth.path(rim.xy, rim.z, { width: hair, alpha: 0.72, closed: true })
    for (const c of [A, B, C, D]) { project(...c, p); project(...O, q); depth.line(p, q, hair * 0.9, 0.45) }
    if (knots) for (const c of [A, B, C, D, O]) knot(c, 2.2 * hair, 0.85)

    for (const tri of triangles) {
      if (small && tri.level > 1) continue
      const from = 0.025 + tri.bank * 0.22 + tri.level * 0.12 + 0.05 * (tri.rank / tri.of)
      const clearFrom = 0.59 + tri.bank * 0.13 + (2 - tri.level) * 0.07 + 0.04 * ((tri.of - 1 - tri.rank) / tri.of)
      const k = view.ease.emphasized(span(t, from, from + 0.1)) * (1 - view.ease.emphasized(span(t, clearFrom, clearFrom + 0.1)))
      if (k < 0.004) continue
      // The three spokes grow from the centroid, so neighbours retain their
      // common boundary and the refinement never leaves mismatched cracks.
      for (const c of tri.corners) {
        project(...tri.center, p)
        project(mix(tri.center[0], c[0], k), 0, mix(tri.center[2], c[2], k), q)
        // New edges come in with the refinement's color and settle to the ink.
        depth.line(p, q, hair * (tri.level === 0 ? 0.9 : 0.65), (0.68 - tri.level * 0.14) * k, blend('c1', 'ink', span(t, from + 0.1, from + 0.3)))
      }
      // The new vertex: a knot at the hub its spokes leave from.
      if (knots) knot(tri.center, (tri.level === 2 ? 1.4 : 1.8) * hair * (0.5 + 0.5 * k), 0.85 * k, 'c1')
    }
    // Two liftable inspection frames exchange their refinement budget.
    for (let bank = 0; bank < 2; bank++) {
      const active = view.ease.standard(span(t, 0.02 + bank * 0.2, 0.18 + bank * 0.2)) * (1 - view.ease.standard(span(t, 0.64 + bank * 0.15, 0.81 + bank * 0.15)))
      const x = bank === 0 ? -15 : 15
      const z = bank === 0 ? -9 : 9
      const size = small ? 9 : 8
      const y = 3 + 7 * active
      for (let j = 0; j < 4; j++) { inspection[j]![0] = x + (j === 0 || j === 3 ? -size : size); inspection[j]![1] = y; inspection[j]![2] = z + (j < 2 ? -size : size) }
      const f = projectPath(inspection, project, xy)
      depth.path(f.xy, f.z + 0.08, { width: hair, alpha: 0.28 + 0.48 * active, closed: true })
      for (const v of inspection) { project(...v, p); project(v[0], 0, v[2], q); depth.line(p, q, hair * 0.65, 0.2 + 0.14 * active) }
      // Only the currently refining window gets a short accent edge.
      const pulse = Math.sin(Math.PI * span(t, 0.07 + bank * 0.2, 0.32 + bank * 0.2)) ** 2
      project(...inspection[0]!, p); project(...inspection[1]!, q)
      depth.line(p, q, hair * 1.3, pulse * 0.95, 'accent')
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Centroid spokes refine two triangular inspection patches in parent-first order.
 *
 * Color: each new vertex is `c1`, and the edges it adds come in in it and settle to the ink; the patch and the frames keep the ink, the refining frame’s edge the accent. */
export function LoaderRefine(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
