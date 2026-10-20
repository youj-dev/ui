'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, clamp, span, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { detail, pens } from './trace'

export const meta = {
  id: 'vitals',
  title: 'Vitals',
  category: 'signal',
  technique: 'paths',
  tags: ['heartbeat', 'pulse', 'ecg', 'monitor', 'health', 'status', 'alive', 'sweep'],
  description: 'A monitor’s sweep writes a steady pulse, each beat a double tap stepping up like a toggle clicking in, the accent head throbbing on the beat as the old trace clears ahead of it.',
  order: 8,
  colors: [{ part: 'Fresh trace', mono: 'ink' }],
} satisfies LoaderMeta

/* A patient monitor's sweep on its screen: crop marks at the corners and,
 * when there's room, a dotted graticule. The accent head writes the trace
 * left to right at an even rate, the freshest stretch with a soft bloom; a
 * gap clears just ahead of it, its far edge a crisp erase line, and beyond
 * the gap the last sweep still shows, dimmer the older it is (the trace is
 * aged in short stretches, so it dims evenly). Each beat is the toggle cue's
 * shape, two taps a step apart, the second taller, so the system's pulse is
 * a switch clicking in; the head swells a little on each one, and a beat
 * light in the screen's corner flashes on every second tap beside its
 * readout. Three beats a sweep, one sweep a loop: the trace ahead of the gap
 * is the same sweep written a loop ago, so there's no seam.
 *
 * Color: the freshly written trace glows `c1` and fades to the ink as it ages; the head stays the accent. */

const ASPECT = 2
const X0 = 8
const X1 = 192
const BASE = 64
const AMP = 38
const BEATS = 3
/** How far ahead of the head the trace is cleared, as a share of the sweep. */
const GAP = 0.07

/** The beat's keypoints: [where in the beat (0–1), height]. A small rise, the double tap, a slow wave. */
const SHAPE: [number, number][] = [
  [0, 0],
  [0.1, 0],
  [0.14, 0.09],
  [0.18, 0],
  [0.27, 0],
  [0.295, -0.1],
  [0.33, 0.62],
  [0.365, -0.22],
  [0.39, 0],
  [0.415, -0.06],
  [0.45, 1],
  [0.49, -0.3],
  [0.52, 0],
  [0.6, 0],
  [0.66, 0.16],
  [0.72, 0.2],
  [0.78, 0.12],
  [0.84, 0],
  [1, 0],
]

/** The sweep's points as [x (0–1 of the strip), height]: the beat's keypoints, three times over. */
const SWEEP = Array.from({ length: BEATS }, (_, b) => SHAPE.slice(b ? 1 : 0).map(([u, v]) => [(b + u) / BEATS, v] as [number, number])).flat()

/** The height at u (0–1 of the strip), between keypoints. */
function at(u: number) {
  let i = 1
  while (i < SWEEP.length - 1 && SWEEP[i]![0] < u) i++
  const [u0, v0] = SWEEP[i - 1]!
  const [u1, v1] = SWEEP[i]!
  return v0 + (v1 - v0) * clamp((u - u0) / (u1 - u0 || 1))
}

const x = (u: number) => X0 + (X1 - X0) * u
const y = (v: number) => BASE - AMP * v

/** The trace from a to b (0–1 of the strip), its keypoints kept so the peaks stay sharp. */
function trace(a: number, b: number) {
  const xy = [x(a), y(at(a))]
  for (const [u, v] of SWEEP) if (u > a && u < b) xy.push(x(u), y(v))
  xy.push(x(b), y(at(b)))
  return xy
}

/** Brightness by age (in sweeps): the fresh trace full, a sweep old about a fifth. */
const glow = (age: number) => 0.18 + 0.82 * Math.exp(-age * 2.2) * (1 - age * 0.25)

/** The screen's top and bottom; the graticule's square cell, its rows through the baseline. */
const TOP = 18
const BOTTOM = 87
const CELL = 11.5
/** Where in a beat its tall tap peaks: the beat light flashes there. */
const PEAK = 0.45
/** The bloom behind the freshest trace, as [reach, alpha]: nested strokes, so it fades along its length without seams. */
const BLOOM = [
  [0.05, 0.05],
  [0.1, 0.035],
  [0.17, 0.025],
] as const

export const scene: Scene = {
  beats: 5,
  still: 0.48,
  draw(pen, t, view) {
    const lod = detail(view)
    const { hair, line, head } = pens(view)
    const pieces = lod === 0 ? 6 : lod === 1 ? 18 : 24
    const cap = lod ? 'butt' : 'round'

    // The screen: crop marks at its corners, and a dotted graticule when there's room.
    if (lod > 0) {
      for (const [cx, cy, dx, dy] of [
        [X0, TOP, 1, 1],
        [X1, TOP, -1, 1],
        [X1, BOTTOM, -1, -1],
        [X0, BOTTOM, 1, -1],
      ] as const) {
        pen.line(cx, cy, cx + dx * 5, cy, hair, 0.42)
        pen.line(cx, cy, cx, cy + dy * 5, hair, 0.42)
      }
    }
    if (lod === 2) {
      for (let i = 1; i < 16; i++) {
        for (const j of [-3, -2, -1, 1]) pen.square(X0 + i * CELL, BASE + j * CELL, hair * 1.2, 0.2)
        pen.line(X0 + i * CELL, BASE - 1.2, X0 + i * CELL, BASE + 1.2, hair, 0.22)
      }
    }
    pen.line(X0, BASE, X1, BASE, hair, lod ? 0.12 : 0.16)

    // The bloom on the freshest trace: just behind the head, and round the right-hand end just after the flyback.
    if (lod > 0) {
      for (const [reach, alpha] of BLOOM) {
        const stroke = { width: line * 3.6, alpha, join: 'round', cap: 'round' } as const
        if (t > 0.002) pen.path(trace(Math.max(0, t - reach), t), stroke)
        const from = Math.max(t + GAP, 1 + t - reach)
        if (from < 0.998) pen.path(trace(from, 1), stroke)
      }
    }

    // Behind the head: this sweep, aged from the head back (near the loop's end the gap starts clearing its far end).
    // Ahead of the gap: the last sweep, older still. Short stretches, so the age dims it evenly.
    for (let s = 0; s < pieces; s++) {
      const a = s / pieces
      const b = (s + 1) / pieces
      const c0 = Math.max(a, t + GAP - 1)
      const c1 = Math.min(b, t)
      if (c1 > c0) pen.path(trace(c0, c1), { width: line, alpha: glow(t - (c0 + c1) / 2), join: 'round', cap, tone: blend('ink', 'c1', span(glow(t - (c0 + c1) / 2), 0.7, 1)) })
      const p0 = Math.max(a, t + GAP)
      if (b > p0) pen.path(trace(p0, b), { width: line, alpha: glow(1 + t - (p0 + b) / 2), join: 'round', cap, tone: blend('ink', 'c1', span(glow(1 + t - (p0 + b) / 2), 0.7, 1)) })
    }

    // The erase line at the gap's far edge, gone where the gap wraps round the screen's ends.
    if (lod > 0) {
      const ex = x(t + GAP > 1 ? t + GAP - 1 : t + GAP)
      const edge = clamp((ex - X0) / 8) * clamp((X1 - ex) / 8)
      if (edge > 0.01) pen.line(ex, BASE - AMP * 0.9, ex, BASE + AMP * 0.34, hair, 0.16 * edge)
    }

    // The beat light: a socket in the corner, flashing on each tall tap, and (when there's room) its readout.
    if (lod > 0) {
      const ph = (((t * BEATS - PEAK) % 1) + 1) % 1
      const flash = view.ease.enter(span(ph, 0, 0.06)) * (1 - view.ease.standard(span(ph, 0.1, 0.6)))
      const lx = lod === 2 ? X1 - 22 : X1 - 7
      const ly = TOP + 6
      const h = head * 0.36
      pen.path([lx - h, ly - h, lx + h, ly - h, lx + h, ly + h, lx - h, ly + h], { width: hair, alpha: 0.36, closed: true })
      if (flash > 0.004) pen.square(lx, ly, h * 2, flash, 'accent')
      if (lod === 2) {
        pen.line(X1 - 16, ly, X1 - 10.4, ly, 1.6 / view.px, 0.55)
        pen.line(X1 - 8.8, ly, X1 - 3.2, ly, 1.6 / view.px, 0.55)
      }
    }

    // The head, swelling a little as it rides each tap, and blinking out as it flies back.
    const show = span(t, 0, 0.015) * (1 - span(t, 0.985, 1))
    if (show > 0.01) {
      const v = at(t)
      pen.square(x(t), y(v), head * (1 + 0.35 * clamp(Math.abs(v) / 0.8)), show, 'accent')
    }
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: ASPECT, tones: meta.colors }

/** A monitor's sweep writes a steady pulse, each beat a double tap, the head throbbing on the beat. */
export function LoaderVitals(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
