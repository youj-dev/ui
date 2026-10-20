'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { camera, clamp, mix, orient, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { stock } from './fabric'

export const meta = {
  id: 'laminate', title: 'Laminate', category: 'geometry', technique: 'planes',
  tags: ['lamination', 'cross grain', 'panel', 'fabrication', 'layers', 'assembly'],
  description: 'Three courses of slats lay in alternating grain directions. The open layers register above one another, their gaps close in sequence into a cross-laminated panel, and a narrow edge bond travels along the finished stock before the layers separate.',
  order: 44,
  colors: [{ part: 'Grain', mono: 'ink' }],
} satisfies LoaderMeta

const depth = new Depth()
const p = point(), q = point()

export const scene: Scene = {
  beats: 6, still: 0.4,
  draw(pen, t, view) {
    const small = view.size < 32
    const hair = (small ? 0.85 : 0.9) / view.px
    const pose = { yaw: -0.61, pitch: -0.51 }
    const project = camera({ ...pose, distance: 380, cx: view.w / 2, cy: 58 })
    const turn = orient(pose)
    const release = view.ease.emphasized(span(t, 0.74, 0.95))

    for (let layer = 0; layer < 3; layer++) {
      const join = clamp(view.ease.emphasized(span(t, 0.3 + layer * 0.1, 0.48 + layer * 0.1))) * (1 - release)
      const y = -13 + layer * (4 + 11 * (1 - join))
      for (let slat = 0; slat < 3; slat++) {
        const lay = clamp(view.ease.enter(span(t, 0.015 + layer * 0.065 + slat * 0.025, 0.16 + layer * 0.065 + slat * 0.025)))
        const clear = view.ease.exit(span(t, 0.8 + (2 - layer) * 0.04 + slat * 0.01, 0.88 + (2 - layer) * 0.04 + slat * 0.01))
        const seated = lay * (1 - clear)
        if (seated <= 0.003) continue
        const along = (slat - 1) * 15
        const offset = (1 - seated) * (slat === 1 ? -12 : 12)
        const cross = layer === 1
        stock(depth, project, turn, cross ? along : offset, y, cross ? offset : along,
          (cross ? 14 : 46) * seated, 3.3 * seated, (cross ? 46 : 14) * seated, hair * 0.65)
        if (!small) for (let grain = -1; grain <= 1; grain++) {
          const side = along + grain * 3
          project(cross ? side : -19 * seated + offset, y + 1.7 * seated, cross ? -19 * seated + offset : side, p)
          project(cross ? side : 19 * seated + offset, y + 1.7 * seated, cross ? 19 * seated + offset : side, q)
          depth.line(p, q, hair * 0.55, 0.22 * seated, 'c1')
        }
      }
    }

    // Orthogonal witness lines locate the stock without adding machinery.
    for (const x of [-26, 26]) {
      project(x, -16, -26, p); project(x, -16, 26, q)
      depth.line(p, q, hair, 0.3)
    }
    project(-26, -16, 26, p); project(26, -16, 26, q)
    depth.line(p, q, hair, 0.44)
    const bond = view.ease.standard(span(t, 0.63, 0.72)) * (1 - view.ease.exit(span(t, 0.74, 0.82)))
    project(-23, -7, 23.1, p); project(mix(-23, 23, bond), -7, 23.1, q)
    depth.line(p, q, hair * 1.5, bond, 'accent')
    depth.flush(pen)
  },
}
/* Color: the slats’ grain lines are `c1`, so the alternating
 * directions read at a glance; the edge bond stays the accent. */
const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }
/** Alternating grain layers register and close into a laminated panel. */
export function LoaderLaminate(props: LoaderProps) { return <LoaderRoot spec={spec} props={props} /> }
