'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, camera, clamp, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { stock } from './fabric'

export const meta = {
  id: 'corbel', title: 'Corbel', category: 'geometry', technique: 'planes',
  tags: ['construction', 'cantilever', 'masonry', 'portal', 'courses', 'support'],
  description: 'Opposed horizontal courses step inward over an open portal. Each projecting stone waits for its supporting course, a cap bridges the remaining throat, and paired bearing witnesses travel down the completed corbels before the courses withdraw from the crown.',
  order: 52,
  colors: [{ part: 'Stones', mono: 'ink' }],
} satisfies LoaderMeta

const depth = new Depth()
const a = point(), b = point()

export const scene: Scene = {
  beats: 6, still: 0.61,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.05 : 1) / view.px
    const pose = { yaw: -0.56, pitch: -0.35 }
    const project = camera({ ...pose, distance: 390, cx: 50, cy: 54 })
    const turn = orient(pose)
    const line = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, alpha: number, accent = false) => {
      project(x0, y0, z0, a); project(x1, y1, z1, b)
      depth.line(a, b, hair * (accent ? 1.3 : 0.8), alpha * clamp(0.85 + (a.z + b.z) / 300, 0.55, 1), accent ? 'accent' : 'ink')
    }
    for (const z of [-13, 13]) line(-34, -28, z, 34, -28, z, 0.35)
    for (const x of [-34, 34]) line(x, -28, -13, x, -28, 13, 0.35)
    for (let course = 0; course < 4; course++) {
      const up = clamp(view.ease.emphasized(span(t, 0.035 + course * 0.105, 0.16 + course * 0.105)))
      const down = view.ease.exit(span(t, 0.75 + (3 - course) * 0.038, 0.865 + (3 - course) * 0.038))
      const seat = up * (1 - down)
      if (seat <= 0.003) continue
      for (const side of [-1, 1]) {
        const x = side * (24 - course * 4 + 7 * (1 - seat))
        const y = -23 + course * 9 + 5 * (1 - seat)
        stock(depth, project, turn, x, y, 0, 18 * seat, 8 * seat, 23 * seat, hair * 0.82, 'ink', true, blend('c1', 'ink', up))
        // Fine bed witnesses expose exactly how far the next course bears
        // on this one; they stay on the stone's near face.
        if (!small && seat > 0.85 && course < 3) line(x - side * 8, y + 4.15, 11.65, x - side * 4, y + 4.15, 11.65, 0.38 * seat)
      }
    }
    const cap = clamp(view.ease.emphasized(span(t, 0.43, 0.56))) * (1 - view.ease.exit(span(t, 0.7, 0.8)))
    if (cap > 0.003) {
      stock(depth, project, turn, 0, 13 + 11 * (1 - cap), 0, 28 * cap, 8 * cap, 23 * cap, hair, 'ink', true, blend('c1', 'ink', cap))
      const joint = view.ease.standard(span(t, 0.54, 0.62)) * cap
      if (joint > 0) line(-12, 9, 11.7, mix(-12, 12, joint), 9, 11.7, joint, true)
    }
    if (!small) {
      const proof = span(t, 0.59, 0.69)
      const alpha = Math.sin(Math.PI * proof)
      if (alpha > 0.002) for (const side of [-1, 1]) {
        const y = mix(8, -26, view.ease.standard(proof)), x = side * mix(10, 26, view.ease.standard(proof))
        line(x - 2, y, 12, x + 2, y, 12, alpha)
        line(x, y + 3, 12, x, y - 2, 12, alpha)
      }
    }
    depth.flush(pen)
  },
}
/* Color: each course and the cap come in outlined in `c1` and
 * settle to the ink as they seat; the cap joint stays the accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Horizontal cantilevers build a stepped masonry portal. */
export function LoaderCorbel(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
