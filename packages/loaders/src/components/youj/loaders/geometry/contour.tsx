'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, span, Depth, point, type Scene } from '../field'
import type { LoaderMeta } from '../categories'

export const meta = {
  id: 'contour',
  title: 'Contour',
  category: 'geometry',
  technique: 'lines',
  tags: ['topography', 'contour lines', 'terrain', 'map', 'squircle', 'survey', 'hidden line'],
  description:
    'A hill drawn only in contour lines, rounded squares stacked at their heights like a cut model: the contours climb toward the accent summit mark and close over it while the model turns a quarter turn.',
  order: 7,
  colors: [{ part: 'Contours', mono: 'ink' }],
} satisfies LoaderMeta

/* A topographic model of a hill whose contours are rounded squares (the
 * youj o's rounding, as a superellipse), each set at its own height and
 * cut out like a layer of a model, so higher layers hide what's behind
 * them. The contours climb: each rises a level as another starts at the
 * foot, and shrinks to nothing at the summit, which is marked by the accent
 * square. Every fourth is an index contour, drawn heavier, as on a map. The
 * contours climb four levels a loop and the model turns a quarter turn, its
 * own symmetry, so the loop has no seam.
 *
 * Color: the upper contours warm from the ink toward `c1` as they
 * climb, so the hill reads as a gradient by height; the summit mark stays
 * the accent. */

const R = 34
const PEAK = 30
const LEVELS = 12
const STEP = PEAK / LEVELS
const ROUND = 4

const DETAIL = [
  { below: 32, samples: 32, every: 2 },
  { below: 80, samples: 48, every: 1 },
  { below: Infinity, samples: 72, every: 1 },
]

/** The contour's reach at height h: a bell, wide at the foot, closing fast at the top. */
const reach = (h: number) => R * Math.max(0, 1 - h / PEAK) ** 0.62

const depth = new Depth()
const p = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 6.5,
  still: 0.3,
  draw(pen, t, view) {
    const { samples, every } = DETAIL.find((d) => view.size < d.below)!
    const yaw = Math.PI / 4 + (Math.PI / 2) * t
    const project = camera({ yaw, pitch: -0.62, distance: 260, cx: view.w / 2, cy: view.h * 0.62 })
    const hair = (view.size < 32 ? 1.15 : 1) / view.px
    const bold = (view.size < 32 ? 1.3 : view.size < 80 ? 1.6 : 2) / view.px
    // The samples slide round with the turn, so the quarter-turned frame is drawn point for point the same.
    const start = (Math.PI / 2) * t

    const ring = (h: number) => {
      const r = reach(h)
      xy.length = 0
      for (let j = 0; j < samples; j++) {
        const a = start + (TAU * j) / samples
        const c = Math.cos(a)
        const s = Math.sin(a)
        project(r * Math.sign(c) * Math.abs(c) ** (2 / ROUND), h, r * Math.sign(s) * Math.abs(s) ** (2 / ROUND), p)
        xy.push(p.x, p.y)
      }
    }

    // The foot of the hill, always there: its outline sits over a contour just leaving it, so the new layer's cut-out never hides it.
    ring(0)
    depth.poly(xy, 0, 0, 'ink', true)
    depth.path(xy, STEP * 1.5 + 0.001, { width: hair, alpha: 0.45, closed: true, join: 'round' })

    // The climbing contours: four levels a loop, each a cut-out layer edged in ink, the index ones heavier.
    for (let k = -4; k < LEVELS; k += every) {
      const h = (k + 4 * t) * STEP
      if (h <= 0.01 || h >= PEAK - 0.3) continue
      ring(h)
      const index = (((k % 4) + 4) % 4) === 0
      // In from the foot, and out before the summit closes it: a ring is gone by the time it's cut.
      const alpha = span(h, 0, STEP * 1.5) * view.ease.standard(clamp((PEAK - 0.3 - h) / (STEP * 1.6))) * (0.42 + 0.5 * (h / PEAK))
      depth.poly(xy, h, 0, 'ink', true)
      // The rings warm toward the hill's color as they climb.
      depth.path(xy, h, { width: index ? bold : hair, alpha: index ? Math.min(1, alpha * 1.25) : alpha, closed: true, join: 'round', tone: blend('ink', 'c1', 0.75 * span(h / PEAK, 0.35, 1)) })
    }

    // The summit mark, in the accent, above the last contour.
    project(0, PEAK + 1.5, 0, p)
    p.z = PEAK + 2
    depth.square(p, clamp(view.size * 0.03, 2.2, 6) / view.px, 1, 'accent')
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A hill in rounded-square contour lines, stacked like a cut model, climbing to the accent summit as it turns. */
export function LoaderContour(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
