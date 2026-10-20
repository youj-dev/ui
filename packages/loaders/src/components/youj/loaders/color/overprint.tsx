'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, camera, clamp, mix, span, Depth, point, projectPath, type Scene, type Tone } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'overprint',
  title: 'Overprint',
  category: 'color',
  technique: 'planes',
  tags: ['print', 'registration', 'plates', 'layers', 'tint', 'press', 'cmyk'],
  description: 'Three print plates, each a square in its own color, slide in from three sides and settle into register, their tints overlapping into one; the registration mark flashes in the accent, and the plates drift apart again.',
  order: 2,
  colors: [
    { part: 'First plate', mono: 'ink' },
    { part: 'Second plate', mono: 'ink' },
    { part: 'Third plate', mono: 'ink', role: 'c4' },
  ],
} satisfies LoaderMeta

/* A press check in the isometric view. Three plates lie stacked a few units
 * apart, each a square sheet of tint with its edge and its own registration
 * cross, pulled out of line in three directions a third of a turn apart.
 * They slide in together (`emphasized`) and close up into one layer: where
 * two tints lie over each other they deepen, and in register the three
 * crosses become one, and the accent's registration mark (a ring and its
 * cross, over the stack) flashes once. Then the plates drift apart again
 * (`standard`), back to where the loop began. Crop marks at the sheet's
 * corners stay put in the ink, so the drift reads against them.
 *
 * Color: each plate is one of the extra tones (`c1` the theme color, `c2` the theme color,
 * `c3` the theme color), its fill a light tint so the overlaps build up, its edge
 * and cross full; without `colors` they're three ink tints, deepening the
 * same way. The registration mark is the accent. */

const HALF = 17
const PULL = 12
const PLATES: { dir: number; tone: Tone }[] = [
  { dir: -Math.PI / 2, tone: 'c1' },
  { dir: -Math.PI / 2 + TAU / 3, tone: 'c2' },
  { dir: -Math.PI / 2 + (2 * TAU) / 3, tone: 'c3' },
]
const SQUARE = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
] as const

const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []
const pts: [number, number, number][] = SQUARE.map(() => [0, 0, 0])

export const scene: Scene = {
  beats: 5,
  still: 0.3,
  draw(pen, t, view) {
    const small = view.size < 32
    const project = camera({ yaw: -0.62 + 0.08 * Math.sin(TAU * t), pitch: -0.6, distance: 260, cx: view.w / 2, cy: view.h / 2 + 3 })
    const hair = 1 / view.px
    const stroke = clamp(view.size * 0.016, 1, 1.6) / view.px

    // Apart at the seam, in register from 0.42 to 0.64, apart again by the end.
    const come = view.ease.emphasized(span(t, 0.04, 0.42))
    const go = view.ease.standard(span(t, 0.64, 0.98))
    const apart = 1 - come + go
    const flash = Math.sin(Math.PI * span(t, 0.4, 0.66)) ** 1.5
    const gap = mix(0.8, 7, apart)

    PLATES.forEach(({ dir, tone }, i) => {
      const cx = Math.cos(dir) * PULL * apart
      const cz = Math.sin(dir) * PULL * apart
      const y = (i - 1) * gap
      SQUARE.forEach(([sx, sz], k) => {
        const c = pts[k]!
        c[0] = cx + sx * HALF
        c[1] = y
        c[2] = cz + sz * HALF
      })
      const sheet = projectPath(pts, project, xy)
      // Ordered by layer: each plate lies over the one below whatever the projection's depth says.
      const key = i * 10
      depth.poly(sheet.xy, key, small ? 0.2 : 0.16, tone)
      depth.path(sheet.xy, key + 1, { width: stroke, alpha: 0.85, tone, closed: true, join: 'miter' })
      if (!small) {
        // The plate's own registration cross, at its center.
        const arm = 4.2
        project(cx - arm, y, cz, p)
        project(cx + arm, y, cz, q)
        depth.path([p.x, p.y, q.x, q.y], key + 2, { width: hair, alpha: 0.75, tone })
        project(cx, y, cz - arm, p)
        project(cx, y, cz + arm, q)
        depth.path([p.x, p.y, q.x, q.y], key + 2, { width: hair, alpha: 0.75, tone })
      }
    })

    // Crop marks at the sheet's corners, fixed in the ink: what the plates are registered to.
    if (!small) {
      const e = HALF + 5
      const arm = 4
      for (const [sx, sz] of SQUARE) {
        project(sx * e, -gap, sz * HALF + sz * 1.5, p)
        project(sx * e + sx * arm, -gap, sz * HALF + sz * 1.5, q)
        depth.path([p.x, p.y, q.x, q.y], -5, { width: hair, alpha: 0.4 })
        project(sx * HALF + sx * 1.5, -gap, sz * e, p)
        project(sx * HALF + sx * 1.5, -gap, sz * e + sz * arm, q)
        depth.path([p.x, p.y, q.x, q.y], -5, { width: hair, alpha: 0.4 })
      }
    }

    // In register, the accent's registration mark over the stack: a ring and its cross.
    if (flash > 0.01) {
      const top = gap + 0.5
      const r = small ? 6 : 5
      xy.length = 0
      for (let i = 0; i <= 24; i++) {
        const a = (TAU * i) / 24
        project(Math.cos(a) * r, top, Math.sin(a) * r, p)
        xy.push(p.x, p.y)
      }
      depth.path(xy, 100, { width: stroke, alpha: flash, tone: 'accent' })
      const arm = r + 3
      project(-arm, top, 0, p)
      project(arm, top, 0, q)
      depth.path([p.x, p.y, q.x, q.y], 101, { width: stroke, alpha: flash, tone: 'accent' })
      project(0, top, -arm, p)
      project(0, top, arm, q)
      depth.path([p.x, p.y, q.x, q.y], 101, { width: stroke, alpha: flash, tone: 'accent' })
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** Three colored print plates slide into register, their tints overlapping, and the accent's registration mark flashes. */
export function LoaderOverprint(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
