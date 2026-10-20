'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { face, hairline, near, type V3 } from './sphere'

export const meta = {
  id: 'chordal', title: 'Chordal', category: 'orbs', technique: 'lines',
  tags: ['sphere', 'geodesic', 'icosahedron', 'subdivision', 'triangles'],
  description: 'An icosahedral sphere refines in a travelling wave as it turns. Edge midpoints lift onto the spherical surface with their hubs, triangular braces appear behind them, and the refined geodesic skin relaxes back to its coarse chords.',
  order: 5,
  colors: [{ part: 'Refinement', mono: 'ink' }],
} satisfies LoaderMeta

const phi = (1 + Math.sqrt(5)) / 2
const vertices: V3[] = [[-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0], [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi], [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]].map(v => { const n = Math.hypot(...v); return v.map(x => x / n) as V3 })
const triangles = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]].map((ids, index) => ({ ids, index, world: Array.from({ length: 6 }, () => [0, 0, 0] as V3) }))
const edges = [[0, 1], [1, 2], [2, 0]], braces = [[3, 4], [4, 5], [5, 3]]
const children = [[0, 3, 5], [3, 1, 4], [5, 4, 2], [3, 4, 5]]
/** Every edge of the icosahedron once, for the hubs at their midpoints.
 *
 * Color: the refinement wave is `c1`: lifted midpoint hubs and their new chords warm with their lift and cool as the skin relaxes. */
const EDGES: [number, number][] = []
for (const { ids } of triangles) for (let i = 0;i < 3;i++) {
  const a = ids[i]!, b = ids[(i + 1) % 3]!
  if (!EDGES.some(([m, n]) => (m === a && n === b) || (m === b && n === a))) EDGES.push([a, b])
}
const depth = new Depth(), p = point(), q = point()
const corners: V3[] = []
const hub: V3 = [0, 0, 0]

export const scene: Scene = {
  beats: 5.5, still: 0.35,
  draw(pen, t, view) {
    t %= 1
    const hair = hairline(view)
    const pose = { yaw: -0.3 + TAU * t, pitch: -0.24 }, project = camera({ ...pose, distance: 320, cx: view.w / 2, cy: view.h / 2 }), turn = orient(pose)
    for (const { ids, index, world } of triangles) {
      const lag = index / triangles.length * 0.14
      const lift = view.ease.emphasized(span(t, 0.05 + lag, 0.35 + lag)) - view.ease.emphasized(span(t, 0.6 + lag / 2, 0.9 + lag / 2))
      for (let i = 0;i < 3;i++) {
        const v = vertices[ids[i]!]!, w = world[i]!
        w[0] = v[0] * 31; w[1] = v[1] * 31; w[2] = v[2] * 31
        const b = vertices[ids[(i + 1) % 3]!]!, mid = world[i + 3]!
        const x = (v[0] + b[0]) / 2, y = (v[1] + b[1]) / 2, z = (v[2] + b[2]) / 2
        // Both neighbours evaluate a shared midpoint at the same material
        // latitude, so the travelling refinement never tears their seam.
        const edgeLag = (y + 1) * 0.07
        const edgeLift = view.ease.emphasized(span(t, 0.05 + edgeLag, 0.35 + edgeLag)) - view.ease.emphasized(span(t, 0.6 + edgeLag / 2, 0.9 + edgeLag / 2))
        const scale = mix(31, 31 / Math.hypot(x, y, z), edgeLift)
        mid[0] = x * scale; mid[1] = y * scale; mid[2] = z * scale
      }
      // The faces are deliberately quiet; the moving chords carry the piece.
      for (const child of children) {
        corners.length = 0; for (const i of child) corners.push(world[i]!)
        face(depth, project, turn, corners)
      }
      for (const [i, j] of edges) {
        const midpoint = 3 + i!
        project(...world[i!]!, p); project(...world[midpoint]!, q)
        depth.line(p, q, hair * 0.85, near((p.z + q.z) / 2) * 0.8)
        project(...world[midpoint]!, p); project(...world[j!]!, q)
        depth.line(p, q, hair * 0.85, near((p.z + q.z) / 2) * 0.8)
      }
      for (const [i, j] of braces) {
        project(...world[i!]!, p); project(...world[j!]!, q)
        depth.line(p, q, hair * (view.size < 32 ? 0.7 : 0.85), lift * near((p.z + q.z) / 2) * 0.78, index === 6 && i === 3 ? 'accent' : blend('ink', 'c1', 0.75 * lift))
      }
    }
    // The hubs: a node at every vertex, and at every edge's midpoint once it has lifted onto the sphere.
    if (view.size >= 32) {
      const r = (view.size < 80 ? 1 : 1.3) / view.px
      for (const v of vertices) {
        project(v[0] * 31.2, v[1] * 31.2, v[2] * 31.2, p)
        p.z += 0.6
        depth.dot(p, r * 1.15, 0.95 * near(p.z))
      }
      for (const [a, b] of EDGES) {
        const A = vertices[a]!, B = vertices[b]!
        const x = (A[0] + B[0]) / 2, y = (A[1] + B[1]) / 2, z = (A[2] + B[2]) / 2
        const lag = (y + 1) * 0.07
        const lift = view.ease.emphasized(span(t, 0.05 + lag, 0.35 + lag)) - view.ease.emphasized(span(t, 0.6 + lag / 2, 0.9 + lag / 2))
        if (lift < 0.02) continue
        const scale = mix(31.2, 31.2 / Math.hypot(x, y, z), lift)
        hub[0] = x * scale; hub[1] = y * scale; hub[2] = z * scale
        project(...hub, p)
        p.z += 0.6
        depth.dot(p, r * 0.85 * Math.min(1, lift * 1.6), 0.9 * near(p.z) * Math.min(1, lift * 2), blend('ink', 'c1', 0.75 * lift))
      }
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** An icosahedral sphere refines in a travelling wave. Edge midpoints lift onto the spherical surface, triangular braces appear behind them, and the refined skin relaxes back to its coarse chords. */
export function LoaderChordal(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
