export type Tone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'
export type Status = 'hit' | 'ahead' | 'on-track' | 'at-risk' | 'behind'

export interface Goal {
  id: string
  label: string
  /** The total to reach by the period's end. */
  target: number
  /** What each day added so far, oldest first: the first day of the period, then each day to today. */
  daily: number[]
  /** Intl.NumberFormat options: currency, compact. */
  format?: Intl.NumberFormatOptions
  /** Its colour. Default: the chart colours in order. */
  tone?: Tone
}

/** The block's item types, under its name. */
export type GoalsGoal = Goal
export type GoalsStatus = Status

/* ── Demo data ─────────────────────────────────────────────────────────────
 * A company's goals for the second half of 2026 (1 July to 31 December),
 * 102 days in on 10 October, from a seeded generator: new annual revenue
 * on track, team activations at risk, lumpy enterprise deals, referrals
 * running ahead and webinars already done. */

/** A seeded generator (mulberry32), so the demo draws the same numbers on every visit. */
function seeded(seed: number) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const ELAPSED = 102

function days(seed: number, base: number, growth: number, noise: number, whole = false) {
  const random = seeded(seed)
  return Array.from({ length: ELAPSED }, (_, d) => {
    const weekday = (d + 3) % 7 // 1 July 2026 is a Wednesday
    const weekend = weekday === 5 || weekday === 6
    const v = (base + growth * d) * (weekend ? 0.55 : 1) * (1 - noise + random() * noise * 2)
    return whole ? Math.round(v) : Math.round(v * 100) / 100
  })
}

/** Deals land on a few days, none on most. */
function lumps(seed: number, count: number) {
  const random = seeded(seed)
  const out = Array.from({ length: ELAPSED }, () => 0)
  for (let i = 0; i < count; i++) out[Math.floor(4 + random() * (ELAPSED - 6))]! += 1
  return out
}

export const GOALS: Goal[] = [
  { id: 'arr', label: 'New ARR', target: 1_300_000, daily: days(3, 4_600, 46, 0.45).map(Math.round), format: { style: 'currency', currency: 'USD', notation: 'compact', maximumSignificantDigits: 3 }, tone: 'chart-1' },
  { id: 'activated', label: 'Activated teams', target: 2_700, daily: days(7, 12.2, 0.05, 0.4, true), tone: 'chart-2' },
  { id: 'deals', label: 'Enterprise deals', target: 12, daily: lumps(11, 7), tone: 'chart-3' },
  { id: 'referrals', label: 'Referral signups', target: 5_000, daily: days(13, 27, 0.14, 0.35, true), tone: 'chart-4' },
  { id: 'webinars', label: 'Webinars hosted', target: 6, daily: Array.from({ length: ELAPSED }, (_, d) => (d % 15 === 9 && d < 92 ? 1 : 0)), tone: 'chart-5' },
]

/** The demo's period: the second half of 2026. */
export const PERIOD = { start: '2026-07-01', end: '2026-12-31' }

export const DEFAULT_COPY = {
  title: 'Second-half goals',
  /** Under the title: the period and how far into it today is. */
  description: (span: string, day: number, days: number) => `${span} · day ${day} of ${days}`,
  goals: 'Goals',
  /** A goal's progress, "$412K of $1.2M". */
  of: (value: string, target: string) => `${value} of ${target}`,
  status: { hit: 'Hit', ahead: 'Ahead', 'on-track': 'On track', 'at-risk': 'At risk', behind: 'Behind' } as Record<Status, string>,
  /** Where it will land at this pace. */
  lands: (value: string) => `Lands near ${value}`,
  projected: 'Projected',
  neededPerWeek: 'Needed a week',
  soFarPerWeek: 'Made a week',
  daysLeft: 'Days left',
  /** The day the projection crosses the target. */
  crosses: (date: string) => `Hits it around ${date}`,
  /** The projection misses: by how much at the end. */
  misses: (value: string) => `Short by ${value} at this pace`,
  /** It was reached on that day. */
  reached: (date: string) => `Reached ${date}`,
  /** The chart's lines. */
  actual: 'So far',
  pace: 'Even pace',
  forecast: 'Forecast',
  target: 'Target',
  /** A goal for assistive tech: progress, status and landing. */
  goal: (label: string, progress: string, share: string, status: string, lands: string) => `${label}: ${progress}, ${share}. ${status}. ${lands}.`,
  /** The chart's name and summary. */
  chart: (label: string) => `${label}, so far and forecast`,
  summary: (actual: string, target: string, pace: string, projected: string, low: string, high: string) =>
    `${actual} so far against an even pace of ${pace} by today. At this rate it lands near ${projected} (likely ${low} to ${high}) against a target of ${target}.`,
  loading: 'Loading goals',
  retry: 'Retry',
  empty: 'No goals for this period',
  emptyDescription: 'Set a target to track it here.',
}

export type GoalsCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale every figure and date is written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/* ── The forecast ──────────────────────────────────────────────────────── */

export interface Forecast {
  actual: number
  /** Where an even pace to the target would be by today. */
  pace: number
  /** Today's rate: the mean daily amount over the last four weeks. */
  rate: number
  /** Where it lands at that rate, and its likely range (80%). */
  projected: number
  low: number
  high: number
  /** The amount a day still needed to hit the target. */
  needed: number
  /** The day (from the period's start, fractional) it reached the target, or will at this rate. */
  crossing?: number
  status: Status
  /** How much a day's amount scatters around the rate (its standard deviation). */
  spread: number
}

const Z80 = 1.2816
/** How much the recent rate itself may drift over the rest of the period. */
const DRIFT = 0.12

/** How far the likely range (80%) reaches either side of the forecast `days` ahead: the days' own scatter, and the rate drifting. */
export const reach = (f: Pick<Forecast, 'spread' | 'rate'>, days: number) => Z80 * Math.sqrt(f.spread ** 2 * Math.max(0, days) + (DRIFT * f.rate * Math.max(0, days)) ** 2)

/** Where a goal stands `elapsed` days into a period of `total` days, and where it will land. */
export function forecast(goal: Goal, total: number): Forecast {
  const elapsed = goal.daily.length
  const actual = goal.daily.reduce((a, b) => a + b, 0)
  const recent = goal.daily.slice(-28)
  const rate = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0
  const spread = recent.length > 1 ? Math.sqrt(recent.reduce((t, v) => t + (v - rate) ** 2, 0) / (recent.length - 1)) : 0
  const remaining = Math.max(0, total - elapsed)
  const projected = actual + rate * remaining
  const width = reach({ spread, rate }, remaining)
  let crossing: number | undefined
  if (actual >= goal.target) {
    let sum = 0
    for (let d = 0; d < elapsed; d++) {
      sum += goal.daily[d]!
      if (sum >= goal.target) {
        crossing = d + 1
        break
      }
    }
  } else if (rate > 0 && projected >= goal.target) crossing = elapsed + (goal.target - actual) / rate
  const ratio = goal.target ? projected / goal.target : 1
  const status: Status = actual >= goal.target ? 'hit' : ratio >= 1.05 ? 'ahead' : ratio >= 1 ? 'on-track' : ratio >= 0.9 ? 'at-risk' : 'behind'
  return {
    actual,
    pace: goal.target * Math.min(1, elapsed / Math.max(1, total)),
    rate,
    projected,
    low: Math.max(actual, projected - width),
    high: projected + width,
    needed: remaining ? Math.max(0, goal.target - actual) / remaining : 0,
    crossing,
    status,
    spread,
  }
}

/** An ISO date as a UTC time. */
export const timeOf = (date: string) => Date.parse(date.length <= 10 ? `${date}T00:00:00Z` : date)
