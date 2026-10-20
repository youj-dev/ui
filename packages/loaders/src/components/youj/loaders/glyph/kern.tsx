'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, clamp, hump, mix, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { CONTOURS, LETTER_BOXES, METRICS, TITTLE, CENTER } from './word'

export const meta = {
  id: 'kern',
  title: 'Kern',
  category: 'glyph',
  technique: 'type',
  tags: ['spacing', 'tracking', 'measure', 'dimension', 'type', 'specimen', 'wordmark'],
  description: 'The word on a type specimen: its letters open out and close up again on their sidebearing guides, and dimension lines measure every gap as it changes.',
  order: 5,
  colors: [{ part: 'Dimensions', mono: 'ink' }],
} satisfies LoaderMeta

/* Drawn flat and precise, as a specimen sheet is: the four letters in
 * outline on the ascender, x-height, baseline and descender guides; a
 * dashed guide at each letter's sides (the j's at its stem, its hook
 * kerning under the u); and under the word a dimension line across each
 * gap, with extension lines and drafting ticks, that grows and shrinks with
 * it. A spacing cursor sweeps across the word and back, never stopping: as
 * it passes a gap going right the gap opens (`emphasized`), going left it
 * closes (`emphasized`), each landing precisely, and the gap it's on is
 * measured a little brighter. Closed at both ends of the loop.
 *
 * Color: the dimension lines are `c1`, the gap the cursor is working on at full strength, the others half. */

const OPEN = 3.4
/** Each letter's spacing edges on the grid: its box, but the j's stem, since its hook tucks under the u. */
const SIDES = LETTER_BOXES.map((box, letter) => (letter === 3 ? { x0: CONTOURS.find((c) => c.letter === 3)!.pts[0]![0], x1: box.x1 } : { x0: box.x0, x1: box.x1 }))
/** How far the cursor reaches past the first and last gap, in gaps. */
const OVER = 0.55
const flat = (x: number, y: number, scale: number, ox: number, oy: number) => [ox + (x - CENTER.x) * scale, oy + (y - CENTER.y) * scale] as const

export const scene: Scene = {
  beats: 5,
  still: 0.25,
  draw(pen, t, view) {
    const small = view.size < 32
    const fine = view.size >= 40
    // The cursor: across the word and back once a loop, in gaps (0 is between the y and the o).
    const sweep = hump(t)
    const f = -OVER + (2 + 2 * OVER) * (sweep + (0.35 * Math.sin(TAU * sweep)) / TAU)
    const going = t < 0.5
    // A gap opens as the cursor passes it going right and closes as it passes going left, landing precisely either way.
    const opens = [0, 1, 2].map((g) => {
      const c = clamp(f - g + 0.5)
      return going ? view.ease.emphasized(c) : 1 - view.ease.emphasized(1 - c)
    })
    const shift = [0, opens[0]!, opens[0]! + opens[1]!, opens[0]! + opens[1]! + opens[2]!].map((s, _, all) => (s - all[3]! / 2) * OPEN)
    // Fit the opened word, so nothing moves out of the frame.
    const scale = (view.w * 0.84) / (LETTER_BOXES[3]!.x1 - LETTER_BOXES[0]!.x0 + 3 * OPEN)
    const ox = view.w / 2
    const oy = view.h / 2 - 3
    const stroke = clamp(view.size * 0.024, 1, 2) / view.px
    const hair = 1 / view.px
    const at = (x: number, y: number, letter: number) => flat(x + shift[letter]!, y, scale, ox, oy)
    const dash = (length: number, size: number) => {
      const n = Math.max(2, Math.round((length + size) / (2 * size)))
      const d = length / (2 * n - 1)
      return [d, d]
    }

    // The guides across the sheet. They stretch as the word opens, keeping their number of dashes, so the dashes never crawl.
    const [left] = at(LETTER_BOXES[0]!.x0 - 1.6, 0, 0)
    const [right] = at(LETTER_BOXES[3]!.x1 + 1.6, 0, 3)
    const dashes = Math.max(4, Math.round((LETTER_BOXES[3]!.x1 - LETTER_BOXES[0]!.x0 + 3.2) * scale / (6 * hair)))
    const d = (right - left) / (2 * dashes - 1)
    for (const y of METRICS) {
      const [, gy] = at(0, y, 0)
      pen.path([left, gy, right, gy], { width: hair, alpha: y === 20 ? 0.28 : 0.14, dash: small ? undefined : [d, d] })
    }

    // Each letter's spacing edges, dashed, ascender to below the dimension lines.
    const [, top] = at(0, METRICS[0]! - 1, 0)
    const [, dimY] = at(0, METRICS[3]! + 2.4, 0)
    const bottom = dimY + 1.6 / view.px
    if (fine) {
      SIDES.forEach((side, letter) => {
        for (const x of [side.x0, side.x1]) {
          const [gx] = at(x, 0, letter)
          pen.path([gx, top, gx, bottom], { width: hair, alpha: 0.2, dash: dash(bottom - top, 2 * hair) })
        }
      })
    }

    for (const c of CONTOURS) {
      const xy = c.pts.flatMap(([x, y]) => at(x, y, c.letter))
      pen.path(xy, { width: stroke, alpha: 0.95, closed: true, join: 'round' })
    }
    const [tx, ty] = at(TITTLE.x, TITTLE.y, 3)
    const ts = TITTLE.size * scale
    pen.poly([tx, ty, tx + ts, ty, tx + ts, ty + ts, tx, ty + ts], 1, 'accent')

    // A dimension line under each gap: the span, a drafting tick at each end; the one the cursor is on, brighter.
    const tick = (small ? 1.2 : 1.6) / view.px
    for (let g = 0; g < 3; g++) {
      const [a] = at(SIDES[g]!.x1, 0, g)
      const [b] = at(SIDES[g + 1]!.x0, 0, g + 1)
      const on = clamp(1 - Math.abs(f - g) * 1.4)
      const alpha = mix(0.38, 0.62, opens[g]!) + 0.3 * on
      // The dimensions are the color, the one the cursor is on fully.
      const tone = blend('ink', 'c1', 0.45 + 0.55 * on)
      pen.line(a, dimY, b, dimY, hair, alpha, tone)
      if (small) continue
      pen.line(a - tick, dimY + tick, a + tick, dimY - tick, hair * 1.3, alpha, tone)
      pen.line(b - tick, dimY + tick, b + tick, dimY - tick, hair * 1.3, alpha, tone)
    }

    // The spacing cursor, between the letters it's working on, with its handle above the ascender.
    const g0 = clamp(Math.floor(f), 0, 1)
    const u = f - g0
    const mid = (g: number) => (at(SIDES[g]!.x1, 0, g)[0] + at(SIDES[g + 1]!.x0, 0, g + 1)[0]) / 2
    const cx = mix(mid(g0), mid(g0 + 1), u)
    const [, cTop] = at(0, METRICS[0]! - 2.2, 0)
    pen.line(cx, cTop, cx, bottom, hair, small ? 0.4 : 0.5)
    if (!small) {
      const s = 2.2 / view.px
      pen.square(cx, cTop, s, 0.85)
    }
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 2, tones: meta.colors }

/** The word on a specimen sheet opens and closes its spacing while dimension lines measure the gaps. */
export function LoaderKern(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
