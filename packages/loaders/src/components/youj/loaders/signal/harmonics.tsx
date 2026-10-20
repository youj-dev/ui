'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, span, type Scene, type View } from '../field'
import type { LoaderMeta } from '../categories'
import { detail, pens } from './trace'

export const meta = {
  id: 'harmonics',
  title: 'Harmonics',
  category: 'signal',
  technique: 'lines',
  tags: ['fourier', 'square wave', 'epicycles', 'phasor', 'sine', 'synthesis', 'harmonic'],
  description: 'A square built from sines: a chain of turning circles adds the odd harmonics one by one, and the wave its tip draws squares up, with every corner, then softens back to a sine.',
  order: 9,
  colors: [{ part: 'Wave', mono: 'ink' }],
} satisfies LoaderMeta

/* Fourier's square wave, drawn by its own machinery: each odd harmonic is a
 * circle turning at its own rate on the rim of the last, sized 1/n, and the
 * tip of the chain (the accent) draws the wave out to the right, newest at
 * the left. The harmonics join one after another (`standard`), so the sine
 * squares up toward Youj's own square, corners ringing, then leave in turn,
 * and the trace shows the change traveling along it. The arms are linked at
 * knots, the first circle is graduated round its rim, and behind the trace
 * the square it's reaching for runs as a dashed ghost, its dashes carried with
 * the wave. Two turns of the fundamental a loop (an even scroll, so the
 * edges glide rather than strobe), the harmonics back to none, so the loop
 * has no seam.
 *
 * Color: the wave leaves the tip in `c1` and settles to the ink as it travels; the circles stay the ink and the tip the accent. */

const ASPECT = 2
const CX = 46
const CY = 50
const R = 20.5
const X0 = 92
const X1 = 192
const TURNS = 2
/** How much of the past the trace shows, in turns of the fundamental. */
const SPAN = 1.45

const LEVELS = [
  { harmonics: [1, 3], samples: 72, ring: 28 },
  { harmonics: [1, 3, 5, 7], samples: 120, ring: 40 },
  { harmonics: [1, 3, 5, 7], samples: 160, ring: 56 },
]

/** How much of harmonic n is in, at loop time t: each joins a little after the last and leaves a little before. */
function weight(n: number, t: number, ease: View['ease']) {
  if (n === 1) return 1
  const k = (n - 3) / 2
  const tt = ((t % 1) + 1) % 1
  return ease.standard(span(tt, 0.08 + 0.08 * k, 0.24 + 0.08 * k)) * (1 - ease.standard(span(tt, 0.84 - 0.08 * k, 0.96 - 0.08 * k)))
}

/** The chain's tip at loop time t, and (when asked) each joint along the way. */
function tip(t: number, harmonics: number[], ease: View['ease'], joints?: number[]) {
  let x = CX
  let y = CY
  const a = TAU * TURNS * t
  for (const n of harmonics) {
    const r = ((R * 4) / (Math.PI * n)) * weight(n, t, ease)
    if (joints) joints.push(x, y, r)
    x += r * Math.cos(n * a)
    y -= r * Math.sin(n * a)
  }
  return [x, y] as const
}

export const scene: Scene = {
  beats: 5,
  still: 0.4,
  draw(pen, t, view) {
    const lod = detail(view)
    const { harmonics, samples, ring } = LEVELS[lod]!
    const { hair, line, head } = pens(view)

    // The axis the wave is drawn along.
    pen.line(X0, CY, X1, CY, hair, 0.16)

    // The first circle's graduations, outside its rim: every quarter when there's room, every 15° above that.
    const r1 = (R * 4) / Math.PI
    if (lod > 0) {
      const marks = lod === 2 ? 24 : 4
      for (let i = 0; i < marks; i++) {
        const a = (TAU * i) / marks
        const long = (i * 4) % marks === 0
        const [c, s] = [Math.cos(a), Math.sin(a)]
        pen.line(CX + c * (r1 + 1.2), CY - s * (r1 + 1.2), CX + c * (r1 + (long ? 3.4 : 2.1)), CY - s * (r1 + (long ? 3.4 : 2.1)), hair, long ? 0.42 : 0.26)
      }
    }

    // The square the harmonics reach for, as a dashed ghost behind the wave. Its dashes are carried with the wave
    // (their phase is the wave's), long against a frame's travel so they never seem to run backward, and a whole
    // number of them go by a loop, so it has no seam.
    if (lod === 2) {
      const per = (X1 - X0) / SPAN
      const period = (TURNS * per) / Math.round((TURNS * per) / 5.5)
      const dash = [period * 0.55, period * 0.45]
      const phase0 = TURNS * t
      const level = (ph: number) => CY - R * Math.sign(Math.sin(TAU * ph) || 1)
      // Its corners: where the phase crosses a half turn.
      const cuts: number[] = [0]
      for (let m = Math.ceil(2 * (phase0 - SPAN)); m <= Math.floor(2 * phase0); m++) {
        const u = (phase0 - m / 2) / SPAN
        if (u > 0 && u < 1) cuts.push(u)
      }
      cuts.sort((a, b) => a - b).push(1)
      for (let i = 0; i + 1 < cuts.length; i++) {
        const [ua, ub] = [cuts[i]!, cuts[i + 1]!]
        const y = level(phase0 - SPAN * ((ua + ub) / 2))
        const xa = X0 + (X1 - X0) * ua
        pen.path([xa, y, X0 + (X1 - X0) * ub, y], { width: hair, alpha: 0.24, dash, offset: (((xa - X0 - phase0 * per) % period) + period) % period })
        if (i > 0) pen.path([xa, CY - R, xa, CY + R], { width: hair, alpha: 0.24, dash })
      }
    }

    // The circles, and the arms between them linked at knots.
    const joints: number[] = []
    const [tx, ty] = tip(t, harmonics, view.ease, joints)
    for (let j = 0; j < joints.length; j += 3) {
      const [jx, jy, r] = [joints[j]!, joints[j + 1]!, joints[j + 2]!]
      if (r < 0.4) continue
      const circle: number[] = []
      for (let i = 0; i < ring; i++) circle.push(jx + r * Math.cos((TAU * i) / ring), jy + r * Math.sin((TAU * i) / ring))
      pen.path(circle, { width: hair, alpha: j ? 0.2 : 0.26, closed: true })
      const nx = j + 3 < joints.length ? joints[j + 3]! : tx
      const ny = j + 3 < joints.length ? joints[j + 4]! : ty
      pen.line(jx, jy, nx, ny, hair * (lod ? 1.2 : 1), 0.6)
      if (lod > 0 && j > 0) pen.square(jx, jy, hair * 2.6 * Math.min(1, r / 2), 0.8)
    }

    // The tip's level carried across to where the wave is being drawn, its dashes fixed at the wave's end.
    pen.path([X0, ty, tx, ty], { width: hair, alpha: 0.4, dash: [2 * hair, 2.5 * hair] })

    // The wave: the tip's past, newest at the left, fading toward the right.
    const pieces = lod ? 8 : 4
    const per = Math.ceil(samples / pieces)
    for (let s = 0; s < pieces; s++) {
      const xy: number[] = []
      for (let i = s * per; i <= Math.min((s + 1) * per, samples); i++) {
        const u = i / samples
        const [, y] = tip(t - (u * SPAN) / TURNS, harmonics, view.ease)
        xy.push(X0 + (X1 - X0) * u, y)
      }
      pen.path(xy, { width: line, alpha: 0.95 * (1 - 0.8 * ((s + 0.5) / pieces) ** 1.5), join: 'round', tone: blend('c1', 'ink', (s + 0.5) / pieces) })
    }

    if (lod) pen.dot(CX, CY, hair * 1.4, 0.6)
    pen.square(tx, ty, head, 1, 'accent')
    pen.square(X0, ty, head * 0.6, 0.9)
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: ASPECT, tones: meta.colors }

/** A square wave built from sines by a chain of turning circles, squaring up and softening back. */
export function LoaderHarmonics(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
