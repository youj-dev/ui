'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, mix, span, Depth, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { dataPlane } from './data-plane'
import { rule, window } from './computing'

export const meta = {
  id: 'coalesce', title: 'Coalesce', category: 'interface', technique: 'planes',
  tags: ['interval', 'union', 'compaction', 'range', 'merge', 'allocation'],
  description: 'Overlapping ranges register against a shared ruler. Each group drops onto its union lane, duplicate coverage contracts into the already claimed span, and the two compact ranges lift back into their original records.',
  order: 28,
  colors: [{ part: 'Brackets', mono: 'ink' }],
} satisfies LoaderMeta

const RANGES = [
  { a: -32, b: -12, row: 0, group: 0 }, { a: -22, b: -2, row: 1, group: 0 }, { a: -9, b: 6, row: 2, group: 0 },
  { a: 13, b: 27, row: 3, group: 1 }, { a: 21, b: 35, row: 4, group: 1 },
]
// Ownership is computed once: only the uncovered suffix survives a merge.
const OWNED = RANGES.map((r, i) => Math.max(r.a, ...RANGES.slice(0, i).filter((p) => p.group === r.group).map((p) => p.b)))
const depth = new Depth()

export const scene: Scene = {
  beats: 5.8, still: 0.34,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 1.1 : 1) / view.px
    const project = camera({ yaw: -0.32, pitch: -0.28, distance: 330, cx: 50, cy: 49 })
    rule(depth, project, -35, -34, -1, 38, -34, -1, hair, 0.52)
    if (!small) for (let x = -30; x <= 35; x += 5) rule(depth, project, x, -34, -1, x, -36, -1, hair * 0.75, 0.35)

    RANGES.forEach((r, i) => {
      const joined = view.ease.emphasized(span(t, 0.04 + i * 0.09, 0.2 + i * 0.09)) * (1 - view.ease.emphasized(span(t, 0.74 + (4 - i) * 0.03, 0.85 + (4 - i) * 0.03)))
      const rowY = 28 - r.row * 11
      const targetY = -25
      // Advance the left endpoint to the end of the preceding claim.
      // The union is exact and never fills the gap between the two groups.
      const left = mix(r.a, OWNED[i]!, joined)
      const y = mix(rowY, targetY, joined)
      const z = mix(8 + i * 2.5, 1, joined)
      window(depth, project, (r.a + r.b) / 2, rowY, -3, r.b - r.a, 5.5, hair * 0.65, small ? 0.15 : 0.19, -1)
      if (!small) {
        for (const x of [r.a, r.b]) rule(depth, project, x, rowY - 4, -3, x, -34, -3, hair * 0.5, 0.12 * (1 - joined))
      }
      const order = dataPlane(depth, project, (left + r.b) / 2, y, z, r.b - left, 6.5, hair * 0.8, 0.64, 0.82)
      // A range's own baseline retains its identity through the merge.
      rule(depth, project, left + 1, y, z + 0.2, r.b - 1, y, z + 0.2, hair * 0.85, 0.52, 'ink', order + 0.04)
      const absorb = Math.sin(Math.PI * joined) ** 2
      if (i === 2 || i === 4) rule(depth, project, left, y - 3.25, z + 0.3, Math.min(left + 4, r.b), y - 3.25, z + 0.3, hair * 1.35, absorb, 'accent', order + 0.06)
    })
    // Brackets certify the compact result only after its final contributor.
    for (const [a, b, finish] of [[-32, 6, 0.38], [13, 35, 0.56]] as const) {
      const k = view.ease.standard(span(t, finish, finish + 0.08)) * (1 - view.ease.exit(span(t, 0.71, 0.79)))
      rule(depth, project, a, -29, 1, mix(a, b, k), -29, 1, hair, k * 0.8, 'c1')
      for (const x of [a, b]) rule(depth, project, x, -27, 1, x, -31, 1, hair, k * 0.8, 'c1')
    }
    depth.flush(pen)
  },
}
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Interval records contract their duplicate coverage into two exact unions.
 *
 * Color: the brackets that certify each merged result draw in `c1`; the ranges and their rail keep the ink, the absorbed edges the accent. */
export function LoaderCoalesce(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
