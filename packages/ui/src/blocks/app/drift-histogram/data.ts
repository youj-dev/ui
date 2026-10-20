import type { DriftHistogramHit } from './stats'

/* A fictional hole's landing positions: pass yours through the block's props. */

/** A small seeded generator, so the demo is the same on every render. */
function random(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Roughly normal: the sum of a few uniform draws, centered. */
const around = (next: () => number, center: number, spread: number) => center + ((next() + next() + next() + next() - 2) / 0.58) * spread

const next = random(7)

const older: DriftHistogramHit[] = Array.from({ length: 34 }, () => ({ x: around(next, 0.004, 0.0075), y: around(next, 0.003, 0.0075) }))
const recent: DriftHistogramHit[] = [
  ...Array.from({ length: 29 }, () => ({ x: around(next, 0.0255, 0.0045), y: around(next, 0.0165, 0.0045) })),
  { x: 0.045, y: 0.026 },
]

/** The older hits, then the recent ones; the last one landed outside the tolerance. */
export const HITS: DriftHistogramHit[] = [...older, ...recent]

/** How many of the latest hits count as recent. */
export const RECENT = 30

/** The tolerance's diameter, in mm. */
export const TOLERANCE = 0.1

export const DEFAULT_COPY = {
  title: 'True position',
  subtitle: (subject: string, parts: number) => `${subject} · ${parts} parts`,
  subject: 'Hole Ø 8 H7',
  stable: 'Stable',
  drifting: 'Drifting',
  corrected: 'Offset applied',
  offsetLabel: (last: number) => `mm offset · last ${last}`,
  capability: 'Cpk',
  chartLabel: (parts: number, older: number, recent: number, out: number, offset: string, tolerance: string) =>
    `Where ${parts} holes landed against a tolerance of Ø ${tolerance} mm: ${older} older, ${recent} recent, ${out} outside it. The recent ones sit ${offset} mm from nominal.`,
  tolerance: (value: string) => `Ø ${value}`,
  keyOlder: 'Older',
  keyRecent: 'Recent',
  keyOut: (n: string) => `Out · ${n}`,
  keyDrift: 'Drift',
  correction: 'Tool offset',
  axis: (name: string, value: string) => `${name} ${value}`,
  apply: 'Apply',
  applying: 'Applying',
  applied: 'Applied',
  announceApplied: (x: string, y: string) => `Tool offset applied: X ${x}, Y ${y}`,
  loadingLabel: 'Loading the hits',
  retry: 'Retry',
  emptyTitle: 'Nothing measured',
  emptyDescription: 'Where the hits land shows up here once there are some.',
}

export type DriftHistogramCopy = typeof DEFAULT_COPY

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}
