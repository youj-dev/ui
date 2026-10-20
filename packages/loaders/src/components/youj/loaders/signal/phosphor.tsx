'use client'

import { LoaderRoot, FIELD_SIZES, type LoaderProps, type LoaderSpec } from '../kit'
import { blend, TAU, span, type Scene } from '../field'
import type { LoaderMeta } from '../categories'
import { detail, pens } from './trace'

export const meta = {
  id: 'phosphor',
  title: 'Phosphor',
  category: 'signal',
  technique: 'lines',
  tags: ['oscilloscope', 'scope', 'trace', 'persistence', 'graticule', 'modulation', 'beam'],
  description: 'A scope’s beam sweeps a modulated signal across its graticule, each trace glowing where it was just written and fading behind the beam, the last sweeps lingering as ghosts.',
  order: 2,
  colors: [{ part: 'Phosphor', mono: 'ink' }],
} satisfies LoaderMeta

/* An oscilloscope screen: a graticule with the docs' crop marks at its
 * corners, and a beam (the accent) sweeping an amplitude-modulated signal
 * across it at an even rate. The scope triggers on the envelope but not on
 * the carrier, so each sweep lands a third of a cycle along from the last,
 * and the screen's persistence keeps the last ones as fading ghosts that
 * fill the envelope. Brightness is the trace's age: each stretch fades from
 * the moment the beam writes it, with a faint bloom where it's freshest.
 * Three sweeps make the loop, and age is measured around the loop, so it
 * has no seam.
 *
 * Color: the trace glows `c1` where the beam just wrote it and decays to the ink as it fades, the ghosts in the ink; the beam stays the accent. */

const ASPECT = 1.4
const L = 10
const R = 130
const TOP = 14
const BOTTOM = 86
const MID = 50
const AMP = 27
const SWEEPS = 3
/** The share of each sweep's time the beam spends writing; the rest is its retrace. */
const WRITE = 0.8
/** How long a trace takes to fade to a third, in loops. */
const GLOW = 0.2

const LEVELS = [
  { cycles: 3, samples: 60, segments: 12, ghosts: 1 },
  { cycles: 8, samples: 120, segments: 16, ghosts: 2 },
  { cycles: 11, samples: 180, segments: 24, ghosts: 2 },
]

const x = (u: number) => L + (R - L) * u
/** The carrier is locked to the trigger; its envelope rolls a third of the way along each sweep. */
const signal = (u: number, cycles: number, sweep: number) =>
  MID - AMP * (0.16 + 0.84 * (0.5 + 0.5 * Math.cos(TAU * (u - 0.2 - sweep / SWEEPS)))) * Math.sin(TAU * cycles * u)

export const scene: Scene = {
  beats: 4.5,
  still: 0.3,
  draw(pen, t, view) {
    const lod = detail(view)
    const { cycles, samples, segments, ghosts } = LEVELS[lod]!
    const { hair, line, head } = pens(view)

    // The graticule: the center lines with their ticks, a dotted grid, crop marks at the corners.
    pen.line(L, MID, R, MID, hair, lod ? 0.2 : 0.24)
    if (lod > 0) {
      pen.line(70, TOP, 70, BOTTOM, hair, 0.2)
      for (let i = 1; i < 10; i++) pen.line(x(i / 10), MID - 1.6, x(i / 10), MID + 1.6, hair, 0.3)
      for (let j = 1; j < 6; j++) pen.line(68.4, TOP + j * 12, 71.6, TOP + j * 12, hair, 0.3)
      const arm = 5
      for (const [cx, cy, dx, dy] of [
        [L, TOP, 1, 1],
        [R, TOP, -1, 1],
        [R, BOTTOM, -1, -1],
        [L, BOTTOM, 1, -1],
      ] as const) {
        pen.line(cx, cy, cx + dx * arm, cy, hair, 0.42)
        pen.line(cx, cy, cx, cy + dy * arm, hair, 0.42)
      }
      // The trigger level, a small mark at the left edge.
      pen.poly([L - 6, MID - 2.2, L - 2.4, MID, L - 6, MID + 2.2], 0.5)
    }
    if (lod === 2) {
      for (let i = 1; i < 10; i++) for (let j = 1; j < 6; j++) if (i !== 5 && j !== 3) pen.square(x(i / 10), TOP + j * 12, hair * 1.2, 0.22)
    }

    // Each sweep's stretches, aged from when the beam wrote them, oldest first.
    const now = t * SWEEPS
    const current = Math.floor(now)
    const beam = span(now - current, 0, WRITE)
    const bloom: { xy: number[]; a: number }[] = []
    const traces: { xy: number[]; a: number }[] = []
    for (let g = ghosts; g >= 0; g--) {
      const k = current - g
      const sweep = ((k % SWEEPS) + SWEEPS) % SWEEPS
      const end = g === 0 ? beam : 1
      for (let s = 0; s < segments; s++) {
        const u0 = s / segments
        if (u0 >= end) break
        const u1 = Math.min((s + 1) / segments, end)
        const written = (k + WRITE * (u0 + u1) * 0.5) / SWEEPS
        const age = t - written
        const a = Math.exp(-age / GLOW) * (1 - Math.min(age, 1))
        if (a < 0.02) continue
        const xy: number[] = []
        const i0 = Math.floor(u0 * samples)
        const i1 = Math.ceil(u1 * samples)
        for (let i = i0; i <= i1; i++) {
          const u = Math.min(Math.max(i / samples, u0), u1)
          xy.push(x(u), signal(u, cycles, sweep))
        }
        traces.push({ xy, a })
        if (lod > 0 && a > 0.45) bloom.push({ xy, a })
      }
    }
    for (const b of bloom) pen.path(b.xy, { width: line * 3.6, alpha: 0.07 * b.a, join: 'round', cap: 'round', tone: 'c1' })
    for (const tr of traces) pen.path(tr.xy, { width: line, alpha: 0.95 * tr.a, join: 'round', cap: 'round', tone: blend('ink', 'c1', tr.a) })

    const show = span(now - current, 0, 0.02) * (1 - span(now - current, WRITE, WRITE + 0.04))
    if (show > 0) pen.square(x(beam), signal(beam, cycles, ((current % SWEEPS) + SWEEPS) % SWEEPS), head, show, 'accent')
  },
}

const spec: LoaderSpec = { id: meta.id, scene, sizes: FIELD_SIZES, aspect: ASPECT, tones: meta.colors }

/** A scope's beam sweeps a modulated signal, the last sweeps fading behind it as ghosts. */
export function LoaderPhosphor(props: LoaderProps) {
  return <LoaderRoot spec={spec} props={props} />
}
