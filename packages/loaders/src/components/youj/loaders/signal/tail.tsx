'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { clamp, seeded, span, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { detail, pens } from './trace'

export const meta = {
  id: 'tail',
  title: 'Tail',
  category: 'signal',
  technique: 'paths',
  tags: ['chart', 'line chart', 'stream', 'live', 'realtime', 'metrics', 'sparkline', 'data'],
  description: 'A live line chart following its newest value: each point arrives as the chart steps left, the accent head drawing the new stretch while a level line marks where it stands.',
  order: 5,
  colors: [{ part: 'Area', mono: 'ink' }],
} satisfies LoaderMeta

/* Like following a log's tail: the chart keeps its newest value at the same
 * place, and each new point arrives as the whole chart steps one place left
 * (`standard`, most of the interval, so it glides from point to point with
 * only a breath at each), the new stretch of line drawn on behind the accent
 * head. The line runs over a faint fill, and between hollow markers at its
 * points (it stops short of each, so nothing crosses them); the newest
 * marker is filled, emptying as the next one takes its place. A dotted
 * level line runs from the head to the notch of a value tag at the edge,
 * the old values fade off the left, and the time ticks travel with the
 * data. Nine points a loop, the series repeating every nine, so the loop
 * has no seam.
 *
 * Color: the area under the line is a faint `c1` wash; the line stays the ink and the head the accent. */

const ASPECT = 2
const L = 8
const R = 192
const TOP = 18
const BOTTOM = 82
const AXIS = BOTTOM + 4
const HEAD = 146
const POINTS = 9
const GAP = 17
/** The value tag at the right edge: its notch, where its body starts, and its half height. */
const TAG_TIP = 171.5
const TAG = 175.5
const TAG_H = 3.9

/** The series: a random walk closed into a loop, kept inside the chart. */
const VALUES = (() => {
  const random = seeded(23)
  const walk = [0]
  for (let i = 1; i < POINTS; i++) walk.push(walk[i - 1]! + (random() - 0.5) * 1.3 + (i % 4 === 0 ? 0.5 : 0))
  const drift = (walk[POINTS - 1]! - walk[0]! + (random() - 0.5) * 0.4) / POINTS
  const closed = walk.map((v, i) => v - drift * i)
  const lo = Math.min(...closed)
  const hi = Math.max(...closed)
  return closed.map((v) => 0.12 + (0.76 * (v - lo)) / (hi - lo))
})()

const value = (n: number) => VALUES[((n % POINTS) + POINTS) % POINTS]!
const y = (v: number) => BOTTOM - (BOTTOM - TOP) * v

/** The line between points n and n + 1 at u (0–1): a Catmull-Rom curve through the points around it. */
function curve(n: number, u: number) {
  const p0 = value(n - 1)
  const p1 = value(n)
  const p2 = value(n + 1)
  const p3 = value(n + 2)
  return 0.5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (3 * p1 - p0 - 3 * p2 + p3) * u * u * u)
}

/** Where the stretch from point n leaves the square of half-side h round its end (`from` 0 its start, 1 its end), as u. */
function exit(n: number, h: number, from: 0 | 1) {
  const end = y(value(n + from))
  let lo = 0
  let hi = 0.5
  for (let i = 0; i < 14; i++) {
    const d = (lo + hi) / 2
    const u = from ? 1 - d : d
    if (Math.max(d * GAP, Math.abs(y(curve(n, u)) - end)) < h) lo = d
    else hi = d
  }
  return from ? 1 - hi : hi
}

export const scene: Scene = {
  beats: 6,
  still: 0.43,
  draw(pen, t, view) {
    const lod = detail(view)
    const { hair, line, head } = pens(view)
    const steps = lod === 0 ? 4 : 8
    const side = clamp(view.size * 0.022, 3, 5.2) / view.px

    // Where the series stands: point n is the newest whole one, s how far the next has come.
    const now = t * POINTS
    const n = Math.floor(now)
    const s = view.ease.standard(span(now - n, 0, 0.86))
    const at = (m: number) => HEAD - (n + s - m) * GAP
    const fade = (x: number) => clamp((x - L) / 34)

    // The grid: three dotted levels, the axis, and time ticks traveling with the data.
    if (lod > 0) for (const v of [0.25, 0.5, 0.75]) pen.path([L, y(v), R, y(v)], { width: hair, alpha: 0.18, dash: [hair, 3 * hair] })
    pen.line(L, AXIS, R, AXIS, hair, 0.18)
    if (lod > 0) {
      for (let m = n - 12; m <= n + 1; m++) {
        if (((m % 3) + 3) % 3 !== 0) continue
        const x = at(m)
        if (x < L || x > HEAD) continue
        pen.line(x, AXIS, x, AXIS + 3, hair, 0.32 * clamp((x - L) / 24))
      }
    }

    // The line, a stretch per interval, over its fill, fading off the left edge; the newest drawn up to the head.
    const trim = lod > 0 ? side / 2 + 0.9 / view.px : 0
    for (let m = n - 11; m <= n; m++) {
      const x0 = at(m)
      if (x0 + GAP <= L) continue
      const end = m === n ? s : 1
      const f0 = Math.max(0, (L - x0) / GAP)
      if (lod > 0 && end > f0) {
        // The fill runs under the whole interval, marker gaps and all; where it fades, in strips, so it fades evenly.
        const strips = fade(x0 + f0 * GAP) < 1 ? steps : 1
        for (let k = 0; k < strips; k++) {
          const ua = f0 + ((end - f0) * k) / strips
          const ub = f0 + ((end - f0) * (k + 1)) / strips
          const fill: number[] = []
          for (let j = 0; j <= steps / strips; j++) {
            const u = ua + ((ub - ua) * j * strips) / steps
            fill.push(x0 + u * GAP, y(curve(m, u)))
          }
          fill.push(x0 + ub * GAP, AXIS, x0 + ua * GAP, AXIS)
          pen.poly(fill, 0.055 * (0.15 + 0.85 * fade(x0 + ((ua + ub) / 2) * GAP)), 'c1')
        }
      }
      // Where it starts and stops: at the left edge, and clear of the markers at its points.
      const u0 = Math.max(trim ? exit(m, trim, 0) : 0, f0)
      const u1 = m === n ? end : trim ? exit(m, trim, 1) : 1
      if (u1 <= u0) continue
      const xy: number[] = []
      for (let k = 0; k <= steps; k++) {
        const u = u0 + ((u1 - u0) * k) / steps
        xy.push(x0 + u * GAP, y(curve(m, u)))
      }
      pen.path(xy, { width: line, alpha: 0.92 * (0.15 + 0.85 * fade(xy[0]!)), join: 'round', cap: lod > 0 ? 'butt' : 'round' })
    }

    // The markers: hollow, the newest filled and emptying as it steps away, clear of the head.
    if (lod > 0) {
      for (let m = n - 11; m <= n; m++) {
        const x = at(m)
        const shown = fade(x) * clamp((HEAD - x - head * 0.6) / 3)
        if (shown <= 0.01) continue
        const py = y(value(m))
        const h = side / 2
        const box = [x - h, py - h, x + h, py - h, x + h, py + h, x - h, py + h]
        const filled = 1 - clamp((HEAD - x - GAP) / GAP)
        if (filled > 0.01) pen.poly(box, 0.92 * filled * shown)
        pen.path(box, { width: line * 0.62, alpha: 0.85 * shown, closed: true, join: 'miter' })
      }
    }

    // The head, and its level carried to the value tag at the edge.
    const hy = y(curve(n, s))
    if (lod > 0) {
      pen.path([HEAD + head * 0.75, hy, TAG_TIP - 1.2, hy], { width: hair, alpha: 0.45, dash: [3 * hair, 3 * hair] })
      // The tag: on paper, so the grid stops at its edge, its notch where the level line ends; its value as two bars.
      const tag = [TAG_TIP, hy, TAG, hy - TAG_H, R, hy - TAG_H, R, hy + TAG_H, TAG, hy + TAG_H]
      pen.poly(tag, 0, 'ink', true)
      pen.path(tag, { width: line * 0.7, alpha: 0.85, closed: true, join: 'miter' })
      if (lod === 2) {
        pen.line(TAG + 2.2, hy, TAG + 8.4, hy, 1.5 / view.px, 0.8)
        pen.line(TAG + 9.8, hy, R - 2.4, hy, 1.5 / view.px, 0.8)
      }
    } else {
      pen.path([HEAD + head, hy, R, hy], { width: hair, alpha: 0.45, dash: [3 * hair, 3 * hair] })
      pen.line(R, hy - 3, R, hy + 3, hair, 0.5)
    }
    pen.square(HEAD, hy, head, 1, 'accent')
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: ASPECT, tones: meta.colors }

/** A live line chart following its newest value, each point arriving as the chart steps left. */
export function LoaderTail(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
