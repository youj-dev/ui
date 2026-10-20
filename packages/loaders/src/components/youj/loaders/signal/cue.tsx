'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, span, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { detail, pens } from './trace'

export const meta = {
  id: 'cue',
  title: 'Cue',
  category: 'signal',
  technique: 'paths',
  tags: ['waveform', 'sound', 'audio', 'cue', 'envelope', 'playhead', 'glass'],
  description: 'The interface’s sounds as waveforms: a tap, a toggle, a bell and a success, each struck and written out by the accent head, then wiped away as the next one rings.',
  order: 1,
  colors: [{ part: 'Strikes', mono: 'ink' }],
} satisfies LoaderMeta

/* Each cue is the shape of its sound in the Glass pack, drawn as a waveform
 * across a strip: a strike, then the ring dying away under its envelope. A
 * tap is one bright ping; a toggle two taps a step apart, the second louder;
 * the bell rings long with a slow shimmer (its twin a few cents sharp); a
 * success is two notes a fifth apart. Higher notes ring denser. The accent
 * head writes each one at the speed of time, its envelope dotted in above
 * and below as it goes, and each note it passes is flagged where it was
 * struck, a dashed drop to the line. A wipe follows from the strike
 * (`emphasized`), a hairline at its front, clearing the strip (flags and
 * all) just as the next cue is struck. Four cues, a beat and a half each;
 * the last one's wipe runs into the first one's strike, so the loop has no
 * seam.
 *
 * Color: each note's strike flag is `c1`, and the envelope's dots
 * lean toward it, so what was struck reads apart from the ink wave. */

const ASPECT = 2
const X0 = 12
const X1 = 188
const BASE = 50
const AMP = 31
/** The strike flags' height: above the loudest swing. */
const FLAG = 10.5

interface Note {
  /** Where on the strip (0–1) it's struck. */
  at: number
  amp: number
  /** Pitch relative to A5: how densely it rings. */
  pitch: number
  /** How fast it dies away, in strip lengths. */
  decay: number
  /** Cycles of a slow beat in its loudness. */
  shimmer?: number
}

const CUES: Note[][] = [
  // tap: a bead under the fingernail, D6.
  [{ at: 0.03, amp: 1, pitch: 1.34, decay: 0.11 }],
  // toggle on: D6 then a step up to E6, the second louder.
  [
    { at: 0.03, amp: 0.62, pitch: 1.34, decay: 0.06 },
    { at: 0.19, amp: 1, pitch: 1.5, decay: 0.11 },
  ],
  // notify: a small bell at A5, its twin a few cents sharp.
  [{ at: 0.03, amp: 1, pitch: 1, decay: 0.36, shimmer: 2.2 }],
  // success: E5, then B5 a fifth up, ringing out.
  [
    { at: 0.03, amp: 0.82, pitch: 0.75, decay: 0.26 },
    { at: 0.21, amp: 0.9, pitch: 1.12, decay: 0.4 },
  ],
]

const ATTACK = 0.004

function wave(notes: Note[], cycles: number, u: number) {
  let y = 0
  for (const n of notes) {
    const d = u - n.at
    if (d <= 0) continue
    const shimmer = n.shimmer ? 0.7 + 0.3 * Math.cos(TAU * n.shimmer * d) : 1
    y += n.amp * (1 - Math.exp(-d / ATTACK)) * Math.exp(-d / n.decay) * shimmer * Math.sin(TAU * cycles * n.pitch * d)
  }
  return y
}

/** The swing the notes allow at u: the wave's envelope, without its ring. */
function envelope(notes: Note[], u: number) {
  let e = 0
  for (const n of notes) {
    const d = u - n.at
    if (d <= 0) continue
    const shimmer = n.shimmer ? 0.7 + 0.3 * Math.cos(TAU * n.shimmer * d) : 1
    e += n.amp * (1 - Math.exp(-d / ATTACK)) * Math.exp(-d / n.decay) * shimmer
  }
  return e
}

/** Rings per strip at A5, and samples per strip, by level of detail. */
const LEVELS = [
  { cycles: 9, samples: 150 },
  { cycles: 13, samples: 240 },
  { cycles: 18, samples: 330 },
].map((level) => ({
  ...level,
  // Each cue at the same height: scaled so its loudest swing reaches the strip's.
  gain: CUES.map((notes) => {
    let peak = 0
    for (let i = 0; i <= 2000; i++) peak = Math.max(peak, Math.abs(wave(notes, level.cycles, i / 2000)))
    return 1 / peak
  }),
}))

const WRITE = 0.6
const x = (u: number) => X0 + (X1 - X0) * u

/** The envelope's dots: part of the way to the strikes' color. */
const DOTS = blend('ink', 'c1', 0.55)

export const scene: Scene = {
  beats: 6,
  still: 0.36,
  draw(pen, t, view) {
    const lod = detail(view)
    const { cycles, samples, gain } = LEVELS[lod]!
    const { hair, line, head } = pens(view)
    const n = CUES.length

    pen.line(X0, BASE, X1, BASE, hair, lod ? 0.16 : 0.22)
    if (lod === 2) {
      // A time ruler under the strip, in the docs' construction hairlines.
      for (let i = 0; i <= 16; i++) {
        const tall = i % 4 === 0
        pen.line(x(i / 16), 88, x(i / 16), tall ? 83 : 85.5, hair, tall ? 0.22 : 0.14)
      }
    }

    for (let c = 0; c < n; c++) {
      // This cue's own time: 0 at its strike, 1 at the next cue's.
      const w = (((t * n - c) % n) + n) % n
      if (w > 1.1) continue
      const notes = CUES[c]!
      const g = gain[c]! * AMP
      const write = span(w, 0, WRITE)
      const sweep = span(w, 0.62, 1.08)
      const wipe = view.ease.emphasized(sweep)
      if (lod > 0) {
        // The envelope, dotted in above and below between the wipe and the head (fixed dots, so they never crawl).
        const dots = lod === 2 ? 72 : 40
        for (let i = Math.ceil(wipe * dots); i <= Math.floor(write * dots); i++) {
          const e = g * envelope(notes, i / dots)
          if (e < 1.5) continue
          pen.square(x(i / dots), BASE - e, hair * 1.3, 0.32, DOTS)
          pen.square(x(i / dots), BASE + e, hair * 1.3, 0.32, DOTS)
        }
        // Each note flagged where it was struck once the head has passed it, a dashed drop to the line, until the wipe takes it.
        for (const note of notes) {
          const a = span(write, note.at, note.at + 0.05) * (1 - span(wipe, note.at - 0.03, note.at))
          if (a <= 0.01) continue
          const sx = x(note.at)
          pen.path([sx, FLAG + 3.4, sx, BASE], { width: hair, alpha: 0.3 * a, dash: [1.5 * hair, 2 * hair] })
          pen.line(sx, FLAG - 1.2, sx, FLAG + 3.4, hair, 0.62 * a, 'c1')
          pen.poly([sx, FLAG - 1.2, sx + 3.2, FLAG - 1.2, sx + 3.2, FLAG + 1.1, sx, FLAG + 1.1], 0.62 * a, 'c1')
        }
        // The wipe's front: a hairline across the strip while it runs.
        if (sweep > 0 && sweep < 1) pen.line(x(wipe), BASE - AMP - 2, x(wipe), BASE + AMP + 2, hair, 0.3 * Math.sin(Math.PI * sweep))
      }
      if (write > wipe) {
        const xy: number[] = []
        const first = Math.ceil(wipe * samples)
        const last = Math.floor(write * samples)
        xy.push(x(wipe), BASE - g * wave(notes, cycles, wipe))
        for (let i = first; i <= last; i++) xy.push(x(i / samples), BASE - g * wave(notes, cycles, i / samples))
        xy.push(x(write), BASE - g * wave(notes, cycles, write))
        pen.path(xy, { width: line, alpha: 0.92, join: 'round', cap: 'round' })
      }
      const show = span(w, 0, 0.03) * (1 - span(w, WRITE, WRITE + 0.08))
      if (show > 0) pen.square(x(write), BASE - g * wave(notes, cycles, write), head, show, 'accent')
    }
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: ASPECT, tones: meta.colors }

/** The interface's sounds as waveforms, struck and written out in turn by the accent head. */
export function LoaderCue(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
