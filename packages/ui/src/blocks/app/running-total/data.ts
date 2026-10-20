/** A note on one day, drawn as a callout at that point of the line. */
export interface RunningTotalNote {
  /** The day it explains: an ISO date within the period. */
  date: string
  text: string
}

/** Every string the card shows or speaks. */
export const DEFAULT_COPY = {
  title: 'Signups',
  subtitle: 'fernhill.example',
  thisPeriod: 'This period',
  previousPeriod: 'Previous period',
  /** After the change, the comparison it is made with. */
  vsPrevious: 'vs previous period',
  chart: 'Signups, running total',
  /** What the readout says for a day: the date, then both running totals. */
  reading: (date: string, current: string, previous: string) => `${date} · ${current} vs ${previous}`,
  passed: 'Passed last period',
  notYet: 'Not yet',
  perDay: 'Per day',
  bestDay: 'Best day',
  empty: 'No signups in this period',
  summary: (current: string, previous: string, days: number, passed: string | undefined) =>
    `Running total of ${current} after ${days} days, against ${previous} at the same point of the previous period.${passed ? ` It passed the previous period's total on ${passed}.` : ''} Use the left and right arrow keys to read each day.`,
}

export type RunningTotalCopy = typeof DEFAULT_COPY & { locale: string }

/* ── Demo data ─────────────────────────────────────────────────────────────
 * Newsletter signups for a made-up site, September 2026: a steady trickle
 * that dips at weekends, one jump on the 17th, and the 30 days before at a
 * slower, even pace. Deterministic, so every visit draws the same. */

const wave = (i: number, base: number, swing: number, weekend: number) => Math.round(base + swing * Math.sin(i * 1.7) + (i % 7 >= 5 ? -weekend : 0))

export const CURRENT = Array.from({ length: 30 }, (_, i) => (i === 16 ? 1180 : wave(i, 330, 36, 120)))
export const PREVIOUS = Array.from({ length: 30 }, (_, i) => wave(i + 3, 300, 40, 90))
export const START = '2026-09-01'
export const NOTE: RunningTotalNote = { date: '2026-09-17', text: 'Newsletter feature' }
