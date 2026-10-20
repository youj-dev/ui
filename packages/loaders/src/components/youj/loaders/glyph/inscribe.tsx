'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, camera, clamp, mix, span, polylineLength, Depth, point, projectPath, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { CONTOURS, LETTER_BOXES, METRICS, TITTLE, world } from './word'

export const meta = {
  id: 'inscribe',
  title: 'Inscribe',
  category: 'glyph',
  technique: 'paths',
  tags: ['wordmark', 'writing', 'draw', 'outline', 'type', 'brand', 'stroke'],
  description: 'The word youj draws itself in outline, letter by letter, on a type designer’s guide lines; the tittle lands in the accent, then the strokes lift off the way they went down.',
  order: 1,
  colors: [{ part: 'Stroke', mono: 'ink' }],
} satisfies LoaderMeta

/* Each letter is its real outlines (the o its counter too), drawn on by a
 * dash running round it, `emphasized`, a short stagger after the letter
 * before, on a plane that rocks a little so the word sits in space. Behind
 * it, the ascender, x-height, baseline and descender in dashed hairlines.
 * The tittle drops onto the j as the j closes (`enter`, its one arrival);
 * after a beat the strokes lift off from where they began. Empty at both
 * ends of the loop.
 *
 * Color: each letter’s outline is drawn in `c1` and settles to the ink once it closes. */

const SCALE = 4.1
const depth = new Depth()
const p = point()
const q = point()
const xy: number[] = []

export const scene: Scene = {
  beats: 5,
  still: 0.36,
  draw(pen, t, view) {
    const project = camera({ yaw: 0.16 * Math.sin(TAU * t), pitch: -0.12, distance: 420, cx: view.w / 2, cy: view.h / 2 + 2 })
    const stroke = clamp(view.size * 0.028, 1, 2.2) / view.px
    const hair = 1 / view.px

    // The guide lines, faint, under the word. Each keeps its number of dashes as the plane rocks, so they never crawl.
    const x0 = LETTER_BOXES[0]!.x0 - 2.2
    const x1 = LETTER_BOXES[3]!.x1 + 2.6
    const dashes = Math.max(4, Math.round(((x1 - x0) * SCALE) / (6 * hair)))
    for (const y of METRICS) {
      project(...world(x0, y, SCALE), p)
      project(...world(x1, y, SCALE), q)
      const d = Math.hypot(q.x - p.x, q.y - p.y) / (2 * dashes - 1)
      depth.path([p.x, p.y, q.x, q.y], -999, { width: hair, alpha: y === 20 ? 0.26 : 0.15, dash: view.size < 32 ? undefined : [d, d] })
    }
    // Crop marks at the specimen's corners.
    if (view.size >= 40) {
      const arm = 2.2
      for (const [x, sx] of [[x0, 1], [x1, -1]] as const) {
        for (const [y, sy] of [[METRICS[0]! - 0.8, 1], [METRICS[3]! + 0.8, -1]] as const) {
          project(...world(x, y, SCALE), p)
          project(...world(x + sx * arm, y, SCALE), q)
          depth.line(p, q, hair, 0.34)
          project(...world(x, y + sy * arm, SCALE), q)
          depth.line(p, q, hair, 0.34)
        }
      }
    }

    for (const c of CONTOURS) {
      const draw = view.ease.emphasized(span(t, 0.04 + c.letter * 0.07, 0.3 + c.letter * 0.07))
      const lift = view.ease.emphasized(span(t, 0.66 + c.letter * 0.04, 0.86 + c.letter * 0.04))
      if (draw <= lift) continue
      const path = projectPath(
        c.pts.map(([x, y]) => world(x, y, SCALE)),
        project,
        xy,
      )
      const length = polylineLength(path.xy, true)
      // A letter is drawn in the color and settles to the ink once it closes.
      const settle = span(t, 0.2 + c.letter * 0.07, 0.34 + c.letter * 0.07)
      depth.path(path.xy, path.z, { width: stroke, alpha: 0.95, closed: true, dash: [(draw - lift) * length, length + 1], offset: -lift * length, tone: blend('c1', 'ink', settle) })
    }

    // The tittle lands on the j as it closes, and lifts away with it.
    const land = view.ease.enter(span(t, 0.44, 0.56))
    const leave = view.ease.exit(span(t, 0.8, 0.92))
    const shown = land * (1 - leave)
    if (shown > 0.01) {
      const drop = mix(-2.6, 0, land) + mix(0, -2, leave)
      const s = TITTLE.size * mix(0.45, 1, shown)
      const cx = TITTLE.x + TITTLE.size / 2
      const cy = TITTLE.y + TITTLE.size / 2 + drop
      const corners = [
        [cx - s / 2, cy - s / 2],
        [cx + s / 2, cy - s / 2],
        [cx + s / 2, cy + s / 2],
        [cx - s / 2, cy + s / 2],
      ] as const
      const quad = corners.flatMap(([x, y]) => {
        project(...world(x, y, SCALE), p)
        return [p.x, p.y]
      })
      depth.poly(quad, p.z, shown, 'accent')
    }
    depth.flush(pen)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 2, tones: meta.colors }

/** The word youj draws itself in outline; the tittle lands, then the strokes lift off. */
export function LoaderInscribe(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
