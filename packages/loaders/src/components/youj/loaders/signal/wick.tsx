'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { TAU, clamp, mix, seeded, span, type Scene, type View } from '../field'
import type { LoaderMeta } from '../categories'
import { detail, pens } from './trace'

export const meta = {
  id: 'wick',
  title: 'Wick',
  category: 'signal',
  technique: 'mixed',
  tags: ['candlestick', 'chart', 'market', 'price', 'live', 'ticker', 'finance', 'data'],
  description: 'A live candlestick chart: the newest candle forms as its price wanders, wicks stretching to each extreme, then it closes, the chart steps left and the next one opens where it closed.',
  order: 14,
  colors: [{ part: 'Rising candles', mono: 'ink' }],
} satisfies LoaderMeta

/* Candles in ink alone: a rising candle hollow (it knocks out what passes
 * behind it), a falling one filled, each with its wick from low to high and
 * its volume in the pane beneath. The newest one forms live: its price
 * wanders toward its close (`standard`), the wick stretching to every
 * extreme it touches, its volume bar rising, a moving average following
 * its price, and a dotted line carries the price to the axis, where a tag
 * in the accent marks it. Then the candle closes, the chart glides a place
 * left (`emphasized`, most of a candle long) and the next opens at the close.
 * Eight candles a loop, the series repeating every eight, so the loop has
 * no seam.
 *
 * Color: a rising candle’s hollow body is outlined in `c1`, the falling ones solid in the ink; the price tag stays the accent. */

const ASPECT = 1.6
const L = 8
const AXIS = 140
const TOP = 12
const BOTTOM = 72
const VOLUME = 90
const CANDLES = 8
const LIVE = AXIS - 14
/** Samples of a candle's path, on a fixed grid, so its high and low only ever grow. */
const SAMPLES = 48

interface Candle {
  open: number
  close: number
  /** How far it wanders on the way, and which way first. */
  wander: number
  phase: number
  /** Its volume, 0–1. */
  volume: number
}

/** The closes, set for a market's rhythm: rises and falls of every size. Each candle opens at the last close. */
const CLOSES = [0.3, 0.6, 0.47, 0.86, 0.7, 0.32, 0.52, 0.14]
const VOLUMES = [0.55, 0.85, 0.4, 1, 0.62, 0.92, 0.5, 0.78]
const SERIES: Candle[] = (() => {
  const random = seeded(61)
  return CLOSES.map((close, i) => ({ open: CLOSES[(i + CANDLES - 1) % CANDLES]!, close, wander: 0.05 + 0.07 * random(), phase: random() * TAU, volume: VOLUMES[i]! }))
})()

const candle = (n: number) => SERIES[((n % CANDLES) + CANDLES) % CANDLES]!

/** The price of candle n at u (0–1 through its forming). */
function price(c: Candle, u: number, ease: View['ease']) {
  return mix(c.open, c.close, ease.standard(u)) + c.wander * Math.sin(Math.PI * u) * Math.sin(TAU * 1.5 * u + c.phase)
}

/** Its high and low so far, at u. */
function range(c: Candle, u: number, ease: View['ease']) {
  const now = price(c, u, ease)
  let hi = Math.max(c.open, now)
  let lo = Math.min(c.open, now)
  for (let i = 1; i <= SAMPLES && i / SAMPLES < u; i++) {
    const v = price(c, i / SAMPLES, ease)
    hi = Math.max(hi, v)
    lo = Math.min(lo, v)
  }
  return [hi + 0.025 * u, lo - 0.025 * u] as const
}

const y = (v: number) => BOTTOM - (BOTTOM - TOP) * v

export const scene: Scene = {
  beats: 6,
  still: 0.6,
  draw(pen, t, view) {
    const lod = detail(view)
    const { hair, line } = pens(view)
    const slot = lod ? 17.5 : 24
    const body = lod ? 9 : 14
    const wick = lod ? hair : hair * 2
    const shown = Math.ceil((LIVE - L) / slot) + 1

    const now = t * CANDLES
    const n = Math.floor(now)
    const f = now - n
    // The chart glides a place left over most of a candle (a soft start, a long landing); the next candle opens once the last is clear of it.
    const shift = view.ease.emphasized(span(f, 0, 0.6))
    const u = span(f, 0.28, 0.96)
    const appear = view.ease.standard(span(f, 0.24, 0.44))
    // Candles fade out entirely before they reach the left edge.
    const fade = (x: number) => clamp((x - L - body / 2) / 22)
    const at = (m: number) => (m === n ? LIVE : LIVE - (n - 1 - m) * slot - shift * slot)

    // The price axis on the right with its ticks, the volume pane's floor, and dotted levels when there's room.
    pen.line(AXIS, TOP - 2, AXIS, BOTTOM + 2, hair, 0.3)
    for (let i = 0; i <= 4; i++) pen.line(AXIS, mix(TOP, BOTTOM, i / 4), AXIS + 2.5, mix(TOP, BOTTOM, i / 4), hair, 0.3)
    if (lod > 0) pen.line(L, VOLUME + 0.5, AXIS, VOLUME + 0.5, hair, 0.24)
    if (lod === 2) for (const v of [0.25, 0.5, 0.75]) pen.path([L, y(v), AXIS - 2, y(v)], { width: hair, alpha: 0.14, dash: [hair, 3 * hair] })

    // Each candle's close as it stands now: the live one's is its wandering price.
    const live = candle(n)
    const close = price(live, u, view.ease)
    const closeOf = (m: number) => (m === n ? (appear > 0 ? close : live.open) : candle(m).close)

    // The moving average of the last three closes, behind the candles, fading off the left edge.
    if (lod === 2) {
      const ma = (m: number) => (closeOf(m) + closeOf(m - 1) + closeOf(m - 2)) / 3
      for (let m = n - shown; m < n; m++) {
        const xa = at(m)
        const xb = at(m + 1)
        if (xb < L) continue
        const xy: number[] = []
        for (let k = 0; k <= 4; k++) {
          const s = k / 4
          // Catmull-Rom through the averages around this stretch.
          const p0 = ma(m - 1)
          const p1 = ma(m)
          const p2 = ma(m + 1)
          const p3 = m + 2 <= n ? ma(m + 2) : p2
          const v = 0.5 * (2 * p1 + (p2 - p0) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s * s + (3 * p1 - p0 - 3 * p2 + p3) * s * s * s)
          xy.push(mix(xa, xb, s), y(v))
        }
        const alpha = 0.5 * fade(xa) * (m + 1 === n ? appear : 1)
        if (alpha > 0.01) pen.path(xy, { width: hair * 1.2, alpha, join: 'round', cap: 'round' })
      }
    }

    const draw = (c: Candle, x: number, hi: number, lo: number, close: number, alpha: number, volume: number) => {
      if (alpha <= 0.01) return
      const top = y(Math.max(c.open, close))
      const bottom = y(Math.min(c.open, close))
      const tall = Math.max(bottom - top, hair)
      const falling = close < c.open
      // Its volume beneath, in the pane under the chart.
      if (lod > 0 && volume > 0) {
        const vh = 12 * volume
        pen.poly([x - body * 0.35, VOLUME - vh, x + body * 0.35, VOLUME - vh, x + body * 0.35, VOLUME, x - body * 0.35, VOLUME], (falling ? 0.34 : 0.2) * alpha)
      }
      pen.line(x, y(hi), x, top, wick, alpha)
      pen.line(x, bottom, x, y(lo), wick, alpha)
      const box = [x - body / 2, top, x + body / 2, top, x + body / 2, top + tall, x - body / 2, top + tall]
      if (falling) pen.poly(box, alpha)
      else {
        pen.poly(box, 0, 'ink', true)
        pen.path(box, { width: line * 0.75, alpha, closed: true, join: 'miter', tone: 'c1' })
      }
    }

    // The closed candles, gliding left as the new one opens, fading off the left edge.
    for (let m = n - shown; m < n; m++) {
      const c = candle(m)
      const x = at(m)
      const [hi, lo] = range(c, 1, view.ease)
      draw(c, x, hi, lo, c.close, 0.92 * fade(x), c.volume)
    }

    // The live candle, forming.
    const [hi, lo] = range(live, u, view.ease)
    if (appear > 0) draw(live, LIVE, hi, lo, close, 0.92 * appear, live.volume * view.ease.standard(u))

    // Its price carried to the axis, where the accent tag marks it.
    const level = y(closeOf(n))
    pen.path([LIVE + body / 2 + 2, level, AXIS, level], { width: hair, alpha: 0.5, dash: [2 * hair, 2 * hair] })
    const th = lod ? 6.4 : 10
    const tw = 13
    const x0 = AXIS + 0.6
    const x1 = AXIS + 3.4
    pen.poly([x0, level, x1, level - th / 2, x1 + tw, level - th / 2, x1 + tw, level + th / 2, x1, level + th / 2], 1, 'accent')
    if (lod > 0) pen.poly([x1 + 1.6, level - 0.8, x1 + tw - 2.6, level - 0.8, x1 + tw - 2.6, level + 0.8, x1 + 1.6, level + 0.8], 0, 'ink', true)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: ASPECT, tones: meta.colors }

/** A live candlestick chart, the newest candle forming as its price wanders, then the chart steps left. */
export function LoaderWick(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
