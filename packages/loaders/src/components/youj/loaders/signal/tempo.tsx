'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, clamp, mix, span, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { durations } from '@youj/core/lib/youj/tokens'
import { detail, pens } from './trace'

export const meta = {
  id: 'tempo',
  title: 'Tempo',
  category: 'signal',
  technique: 'lines',
  tags: ['gauge', 'dial', 'meter', 'needle', 'sweep', 'tokens', 'speedometer'],
  description: 'A dial scaled in the motion tokens: the needle steps up through instant, fast, base, slow and deliberate, landing on each tick as it lights, then sweeps home.',
  order: 6,
  colors: [{ part: 'Progress', mono: 'ink' }],
} satisfies LoaderMeta

/* A gauge whose scale is the motion tokens' durations, set out on a log
 * scale as the durations grow (each roughly half again the last), inside a
 * round bezel. The scale is graduated (minor, mid and the token ticks, each
 * token's name a short bar inside it), and a tapered needle with its
 * counterweight turns on a pinned hub. The needle steps from one token to
 * the next (`standard`: off the mark at once, a long landing), and each
 * token's tick lights as the needle closes on it; from deliberate it sweeps
 * home in one hero move (`emphasized`) and the ticks dim as it passes back.
 * The progress arc follows the needle, its end in the accent. Home at both
 * ends of the loop, so there's no seam.
 *
 * Color: the progress arc is `c1`, and each token’s tick warms toward it as it lights; the dial stays the ink and the needle’s head the accent. */

const CX = 50
const CY = 50
/** The scale's outer edge; the bezel rings sit outside it. */
const R = 37
const TRACK = R - 10
const FROM = (225 / 360) * TAU
const SWEEP = (270 / 360) * TAU
const LO = Math.log2(60)
const HI = Math.log2(720)

/** Where a duration sits on the scale, 0–1. */
const scale = (ms: number) => (Math.log2(ms) - LO) / (HI - LO)
const STOPS = [0, ...Object.values(durations).map(scale)]
/** Each token's name, as the length of the bar that stands for it. */
const NAMES = Object.keys(durations).map((name) => name.length)
const angle = (f: number) => FROM - SWEEP * f
const at = (f: number, r: number): [number, number] => [CX + r * Math.cos(angle(f)), CY - r * Math.sin(angle(f))]

/** The arc from `from` to f at radius r, as screen points. */
function arc(f: number, r: number, from = 0) {
  const xy: number[] = []
  const n = Math.max(2, Math.ceil(48 * (f - from)))
  for (let i = 0; i <= n; i++) xy.push(...at(from + ((f - from) * i) / n, r))
  return xy
}

/** A circle round (x, y) as a closed outline. */
function circle(x: number, y: number, r: number, n = 24) {
  const xy: number[] = []
  for (let i = 0; i < n; i++) xy.push(x + r * Math.cos((TAU * i) / n), y + r * Math.sin((TAU * i) / n))
  return xy
}

/** Graduations by level of detail: minor ticks, and every few a longer one. */
const GRADUATIONS = [
  { minor: 0, mid: 0 },
  { minor: 15, mid: 5 },
  { minor: 30, mid: 5 },
]

export const scene: Scene = {
  beats: 6,
  still: 0.61,
  draw(pen, t, view) {
    const lod = detail(view)
    const { hair, line, head } = pens(view)

    // The needle's place: five steps up, one beat each, then home.
    const beat = t * 6
    const step = Math.min(Math.floor(beat), 5)
    const f =
      step < 5
        ? mix(STOPS[step]!, STOPS[step + 1]!, view.ease.standard(span(beat - step, 0, 0.7)))
        : mix(STOPS[5]!, 0, view.ease.emphasized(span(beat - 5, 0.05, 0.9)))

    // The bezel: one ring, doubled when there's room.
    pen.path(circle(CX, CY, 45, lod ? 64 : 40), { width: hair, alpha: lod ? 0.34 : 0.4, closed: true })
    if (lod === 2) pen.path(circle(CX, CY, 43.4, 64), { width: hair, alpha: 0.16, closed: true })

    // The track, its zero stop, and the progress along it.
    pen.path(arc(1, TRACK), { width: hair, alpha: 0.2 })
    if (lod > 0) {
      const [x1, y1] = at(0, TRACK - 2.4)
      const [x2, y2] = at(0, TRACK + 2.4)
      pen.line(x1, y1, x2, y2, hair, 0.5)
    }
    if (f > 0.002) pen.path(arc(f, TRACK), { width: line * 1.5, alpha: 0.9, cap: 'butt', tone: 'c1' })

    // The graduations: minor ticks, a longer one every few.
    const { minor, mid } = GRADUATIONS[lod]!
    for (let i = 0; minor && i <= minor; i++) {
      const long = i % mid === 0
      const [x1, y1] = at(i / minor, R - (long ? 4.2 : 2.2))
      const [x2, y2] = at(i / minor, R)
      pen.line(x1, y1, x2, y2, hair, long ? 0.42 : 0.26)
    }

    // A tick for each token, lighting as the needle closes on it and dimming as it passes back; its name inside.
    for (let k = 1; k < STOPS.length; k++) {
      const lit = view.ease.standard(clamp((f - STOPS[k]!) / 0.04 + 1))
      const [x1, y1] = at(STOPS[k]!, R - 7)
      const [x2, y2] = at(STOPS[k]!, R + 1.4)
      pen.line(x1, y1, x2, y2, lod ? line : line * 1.2, 0.34 + 0.62 * lit, blend('ink', 'c1', 0.8 * lit))
      if (lod === 2) {
        const [lx, ly] = at(STOPS[k]!, 19.5)
        const half = NAMES[k - 1]! * 0.26
        pen.line(lx - half, ly, lx + half, ly, 1.1 / view.px, 0.2 + 0.34 * lit)
      }
    }

    // The needle: tapered, with its counterweight, turning on a pinned hub.
    const a = angle(f)
    const dx = Math.cos(a)
    const dy = -Math.sin(a)
    if (lod === 0) {
      const [nx, ny] = at(f, R - 4)
      const [tx, ty] = at(f, -6)
      pen.line(tx, ty, nx, ny, line, 0.95)
      pen.dot(CX, CY, clamp(view.size * 0.022, 1.5, 3) / view.px, 1)
    } else {
      // Tip to hub to the counterweight's disc; the hub's paper cap closes over the root, its ring and pin on top.
      const w = 1.15
      const tip = R - 3
      const tail = 6.4
      pen.poly(
        [
          CX + dx * tip, CY + dy * tip,
          CX - dy * w, CY + dx * w,
          CX - dx * tail - dy * w * 0.7, CY - dy * tail + dx * w * 0.7,
          CX - dx * tail + dy * w * 0.7, CY - dy * tail - dx * w * 0.7,
          CX + dy * w, CY - dx * w,
        ],
        0.95,
        'ink',
        true,
      )
      pen.poly(circle(CX - dx * tail, CY - dy * tail, 1.9, 16), 0.95, 'ink', true)
      const cap = circle(CX, CY, 2.9, 20)
      pen.poly(cap, 0, 'ink', true)
      pen.path(cap, { width: line * 0.8, alpha: 0.95, closed: true })
      pen.dot(CX, CY, 0.95, 1)
    }

    const [hx, hy] = at(f, TRACK)
    pen.square(hx, hy, head, 1, 'accent')
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: 1, tones: meta.colors }

/** A dial scaled in the motion tokens: the needle steps through them and sweeps home. */
export function LoaderTempo(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
