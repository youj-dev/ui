'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { clamp, mix, seeded, span, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { detail, pens } from './trace'

export const meta = {
  id: 'delta',
  title: 'Delta',
  category: 'signal',
  technique: 'paths',
  tags: ['chart', 'line chart', 'diff', 'update', 'caret', 'revision', 'data', 'refresh'],
  description: 'A line chart rewritten in place: a caret sweeps across it and each point it passes moves to its new value, leaving the old line as a dashed ghost and the change marked, three times a loop.',
  order: 10,
  colors: [{ part: 'Change', mono: 'ink' }],
} satisfies LoaderMeta

/* A chart being revised, the way a diff reads: a playhead with a flag
 * sweeps from left to right at an even rate, and each point it passes moves
 * to its new value (`standard`), warming to the accent while it travels and
 * cooling back to its hollow marker as it lands. Behind the caret the old
 * series stays as a dashed ghost with its own faint markers, the band
 * between old and new is shaded, and each change is dimensioned: a hairline
 * from the old value with an arrowhead stopping at the new marker's rim.
 * The markers knock the line out where it meets them. The caret never stops
 * while it shows: it fades in as it sets off and out as it leaves the plot.
 * Three revisions a loop, the last returning to the first series, so the
 * loop has no seam.
 *
 * Color: the change marks (each point’s arrow from old to new) are `c1`, fading with the ghost; the line stays the ink and the caret the accent. */

const ASPECT = 1.6
const L = 14
const R = 150
const TOP = 16
const BOTTOM = 80
const N = 8

const SERIES = (() => {
  const random = seeded(41)
  return Array.from({ length: 3 }, () => Array.from({ length: N }, () => 0.14 + 0.72 * random()))
})()

const x = (i: number) => L + 6 + ((R - L - 12) * i) / (N - 1)
const y = (v: number) => BOTTOM - (BOTTOM - TOP) * v

/** The caret's sweep: from X0 to X1 at an even rate over [C0, C1] of a revision. */
const C0 = 0.02
const C1 = 0.74
const X0 = L + 1
const X1 = R + 5
/** When (0–1 through a revision) the caret reaches point i, and how long the point takes to move. */
const passed = (i: number) => C0 + ((C1 - C0) * (x(i) - X0)) / (X1 - X0)
const MOVE = 0.17

/** A closed square around (cx, cy), `s` across. */
const square = (cx: number, cy: number, s: number) => [cx - s / 2, cy - s / 2, cx + s / 2, cy - s / 2, cx + s / 2, cy + s / 2, cx - s / 2, cy + s / 2]

export const scene: Scene = {
  beats: 6,
  still: 0.45,
  draw(pen, t, view) {
    const lod = detail(view)
    const { hair, line, head } = pens(view)
    const ring = head * 0.7

    // Which revision, and how far through it.
    const now = t * 3
    const r = Math.min(Math.floor(now), 2)
    const w = now - r
    const from = SERIES[r]!
    const to = SERIES[(r + 1) % 3]!

    // The frame: an axis on two sides, a tick under each point and on the levels, dotted levels when there's room.
    pen.line(L, TOP - 2, L, BOTTOM, hair, 0.3)
    pen.line(L, BOTTOM, R, BOTTOM, hair, 0.3)
    if (lod > 0) {
      for (let i = 0; i < N; i++) pen.line(x(i), BOTTOM, x(i), BOTTOM + 3, hair, 0.3)
      for (const v of [0.25, 0.5, 0.75]) pen.line(L - 2.5, y(v), L, y(v), hair, 0.3)
    }
    if (lod === 2) for (const v of [0.25, 0.5, 0.75]) pen.path([L, y(v), R, y(v)], { width: hair, alpha: 0.16, dash: [hair, 3 * hair] })

    // Each point moves to its new value once the caret has passed it, warming to the accent on the way.
    const window = from.map((_, i) => span(w, passed(i), passed(i) + MOVE))
    const progress = window.map((u) => view.ease.standard(u))
    const warm = window.map((u) => Math.sin(Math.PI * u))
    const values = from.map((v, i) => mix(v, to[i]!, progress[i]!))
    const newLine = values.flatMap((v, i) => [x(i), y(v)])
    const oldLine = from.flatMap((v, i) => [x(i), y(v)])

    // The old series as a dashed ghost, the band between old and new, and each change dimensioned.
    const ghost = view.ease.standard(span(w, 0.03, 0.12)) * (1 - view.ease.standard(span(w, 0.86, 1)))
    if (lod > 0 && ghost > 0.01) {
      const band = [...newLine]
      for (let i = N - 1; i >= 0; i--) band.push(oldLine[2 * i]!, oldLine[2 * i + 1]!)
      pen.poly(band, 0.05 * ghost)
      pen.path(oldLine, { width: hair, alpha: 0.42 * ghost, dash: [2.5 * hair, 2.5 * hair], join: 'round' })
      const arrow = lod === 2 ? 2.4 : 0
      values.forEach((v, i) => {
        if (progress[i]! <= 0) return
        const y0 = y(from[i]!)
        const y1 = y(v)
        const dir = Math.sign(y1 - y0)
        const gap = ring / 2 + 0.9
        const start = lod === 2 ? y0 + dir * gap : y0
        const tip = y1 - dir * gap
        const room = clamp((Math.abs(tip - start) - arrow - 1) / 3)
        if (lod === 2) pen.path(square(x(i), y0, ring * 0.86), { width: hair, alpha: 0.4 * ghost, closed: true })
        else pen.line(x(i) - 1.4, y0, x(i) + 1.4, y0, hair, 0.5 * ghost)
        if (room <= 0) return
        pen.line(x(i), start, x(i), tip - dir * arrow, hair, 0.55 * ghost * room, 'c1')
        if (arrow) pen.poly([x(i), tip, x(i) - arrow * 0.5, tip - dir * arrow, x(i) + arrow * 0.5, tip - dir * arrow], 0.75 * ghost * room, 'c1')
      })
    }

    // The caret: a playhead with a flag, fading in as it sets off and out as it leaves the plot; it never stops while it shows.
    const show = view.ease.standard(span(w, C0, C0 + 0.06)) * (1 - view.ease.standard(span(w, C1 - 0.08, C1)))
    if (show > 0.01) {
      const cx = mix(X0, X1, span(w, C0, C1))
      if (lod > 0) {
        pen.line(cx, TOP - 2.5, cx, BOTTOM + 3, hair, 0.5 * show)
        pen.poly([cx - 2.2, TOP - 7.5, cx + 2.2, TOP - 7.5, cx + 2.2, TOP - 4.5, cx, TOP - 2.5, cx - 2.2, TOP - 4.5], 0.85 * show)
      } else {
        pen.line(cx, TOP - 2, cx, BOTTOM, hair, 0.55 * show)
      }
    }

    // The series; its hollow markers knock the line out where they sit; a moving point warms to the accent.
    pen.path(newLine, { width: line, alpha: 0.95, join: 'round', cap: 'round' })
    values.forEach((v, i) => {
      const px = x(i)
      const py = y(v)
      if (lod > 0) {
        const box = square(px, py, ring)
        pen.poly(box, 0, 'ink', true)
        pen.path(box, { width: line * 0.6, alpha: 0.95, closed: true })
      }
      const k = warm[i]!
      if (k > 0.01) pen.square(px, py, mix(lod > 0 ? ring : head * 0.6, head, k), k, 'accent')
    })
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: ASPECT, tones: meta.colors }

/** A line chart rewritten in place by a sweeping caret, its old line left as a dashed ghost. */
export function LoaderDelta(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
