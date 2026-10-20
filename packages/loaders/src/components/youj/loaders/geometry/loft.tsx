'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, lambert, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'loft', title: 'Loft', category: 'geometry', technique: 'lines',
  tags: ['loft', 'profiles', 'hull', 'ribs', 'surface', 'cad', 'fabrication'],
  description: 'Unequal transverse ribs erect along a curved keel, then longitudinal battens connect matching profile points into a lofted hull. A narrow lit skin advances between the ribs, exposing the hollow interior before the shell and its supporting profiles withdraw.',
  order: 45,
  colors: [{ part: 'Battens', mono: 'ink' }],
} satisfies LoaderMeta

type V3 = [number, number, number]
const RIBS = 7, SAMPLES = 12
const ribs: V3[][] = Array.from({ length: RIBS }, (_, r) => {
  const u = r / (RIBS - 1)
  const width = 7 + 17 * Math.sin(Math.PI * u) ** 0.8
  const bottom = -15 + 10 * (u - 0.5) ** 2
  return Array.from({ length: SAMPLES + 1 }, (_, j) => {
    const a = Math.PI * j / SAMPLES
    return [-31 + 62 * u, bottom + 22 * (1 - Math.sin(a)), width * Math.cos(a)]
  })
})
const depth = new Depth()
const p = point(), q = point()
const corners = Array.from({ length: 4 }, point)
const xy: number[] = []
const world: V3[][] = ribs.map(row => row.map(() => [0, 0, 0]))

export const scene: Scene = {
  beats: 6, still: 0.51,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    const pose = { yaw: -0.4, pitch: -0.35 }
    const project = camera({ ...pose, distance: 340, cx: view.w / 2, cy: 48 })
    const turn = orient(pose)
    const clear = view.ease.exit(span(t, 0.78, 0.93))
    const step = small ? 2 : 1
    for (let r = 0; r < RIBS; r++) {
      const erected = clamp(view.ease.emphasized(span(t, 0.025 + r * 0.045, 0.17 + r * 0.045))) * (1 - clear)
      for (let j = 0; j <= SAMPLES; j++) {
        const a = ribs[r]![j]!, b = world[r]![j]!
        b[0] = a[0]; b[1] = mix(-15, a[1], erected); b[2] = a[2] * erected
      }
      if (r % step && r !== RIBS - 1) continue
      for (let j = 0; j < SAMPLES; j++) {
        project(...world[r]![j]!, p); project(...world[r]![j + 1]!, q)
        depth.line(p, q, hair * (small ? 0.95 : 0.85), (0.35 + clamp((p.z + 25) / 65) * 0.5) * erected)
      }
    }

    // The keel remains. Every batten joins the same parameter on adjacent
    // profiles, rather than revolving one section around an axis.
    project(-34, -15, 0, p); project(34, -15, 0, q)
    depth.line(p, q, hair * 1.1, 0.5)
    for (let r = 0; r < RIBS - 1; r++) {
      const join = clamp(view.ease.standard(span(t, 0.31 + r * 0.045, 0.44 + r * 0.045))) * (1 - clear)
      for (let j = 0; j <= SAMPLES; j += small ? 6 : view.size < 80 ? 3 : 2) {
        const a = world[r]![j]!, b = world[r + 1]![j]!
        project(...a, p); project(mix(a[0], b[0], join), mix(a[1], b[1], join), mix(a[2], b[2], join), q)
        depth.line(p, q, hair * 0.8, join * 0.8, blend('ink', 'c1', 0.7))
      }
      // Only the near lower quarter is skinned: an open section makes the
      // interior and the supporting ribs visible even at icon sizes.
      const skin = clamp(view.ease.emphasized(span(t, 0.48 + r * 0.035, 0.59 + r * 0.035))) * (1 - clear)
      if (skin <= 0.003) continue
      for (let j = 0; j < 3; j++) {
        const a = world[r]![j]!, b = world[r]![j + 1]!, c = world[r + 1]![j + 1]!, d = world[r + 1]![j]!
        project(...a, corners[0]!); project(...b, corners[1]!)
        project(mix(b[0], c[0], skin), mix(b[1], c[1], skin), mix(b[2], c[2], skin), corners[2]!)
        project(mix(a[0], d[0], skin), mix(a[1], d[1], skin), mix(a[2], d[2], skin), corners[3]!)
        const angle = Math.PI * (j + 0.5) / SAMPLES
        const normal = turn(0, Math.sin(angle), Math.cos(angle))
        xy.length = 0
        let z = 0
        for (const corner of corners) { xy.push(corner.x, corner.y); z += corner.z / 4 }
        depth.face(xy, z + 0.02, lambert(...normal))
        if (j === 2) depth.path(xy.slice(2, 6), z + 0.04, { width: hair * 1.2, alpha: skin * 0.9, tone: r === 3 ? 'accent' : 'ink' })
      }
    }
    depth.flush(pen)
  },
}
/* Color: the longitudinal battens are drawn toward `c1`, set apart
 * from the ink ribs; the skin’s edge stays the accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Unequal hull profiles connect into an open lofted shell. */
export function LoaderLoft(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
