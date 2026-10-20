export type Granularity = 'week' | 'month'
export type Measure = 'percent' | 'people'

export interface Cohort {
  id: string
  /** When the cohort started: an ISO date, read as UTC. */
  start: string
  /** How many people started in it. */
  size: number
  /** How many were active in each period since, period 0 (the start) first. */
  active: number[]
}

/** The block's item types, under its name. */
export type RetentionCohort = Cohort
export type RetentionGranularity = Granularity
export type RetentionMeasure = Measure

/* ── Demo data ─────────────────────────────────────────────────────────────
 * A product's signups by week (12 cohorts, mid-July to the end of
 * September) and by month (April to September), from a seeded generator so
 * every visit draws the same. Retention falls fast for a few periods and
 * settles; cohorts after the new onboarding (24 August) settle higher, and
 * the launch week's cohort is large but leaves quickly. Today is 10 October
 * 2026: every cohort's latest period is still running, so its last reading
 * is partial. */

const DAY = 86_400_000

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

const iso = (t: number) => new Date(t).toISOString().slice(0, 10)

/** Share still active `p` periods in: a fast fall settling at `floor`. */
const curve = (p: number, floor: number, pace: number) => (p === 0 ? 1 : floor + (1 - floor) * Math.exp(-p / pace))

function cohorts(granularity: Granularity): Cohort[] {
  const random = seeded(granularity === 'week' ? 5 : 9)
  const starts =
    granularity === 'week'
      ? Array.from({ length: 12 }, (_, i) => Date.UTC(2026, 6, 13) + i * 7 * DAY)
      : Array.from({ length: 6 }, (_, i) => Date.UTC(2026, 3 + i, 1))
  // Periods that have begun by 10 October: weeks to the one starting 5 October, months to October.
  const periods = (start: number) => (granularity === 'week' ? Math.floor((Date.UTC(2026, 9, 5) - start) / (7 * DAY)) + 1 : 9 - new Date(start).getUTCMonth() + 1)
  return starts.map((start, i) => {
    const launch = granularity === 'week' && iso(start) === '2026-09-21'
    const onboarding = start >= Date.UTC(2026, 7, 24)
    const size = Math.round((granularity === 'week' ? 1050 : 4600) * (1 + i * 0.03) * (0.9 + random() * 0.2) * (launch ? 2.1 : 1))
    // The new onboarding keeps people longer; the launch week's crowd leaves faster.
    const floor = (granularity === 'week' ? 0.24 : 0.19) + (onboarding ? 0.06 : 0) - (launch ? 0.06 : 0) + (random() - 0.5) * 0.03
    const pace = (granularity === 'week' ? 1.8 : 1.3) * (onboarding ? 1.35 : 1) * (launch ? 0.55 : 1) * (0.9 + random() * 0.2)
    const n = periods(start)
    return {
      id: iso(start),
      start: iso(start),
      size,
      active: Array.from({ length: n }, (_, p) => {
        const share = curve(p, floor, pace) * (p === 0 ? 1 : 0.96 + random() * 0.08)
        // The period still running has only part of its people back so far.
        const soFar = p === n - 1 && p > 0 ? 0.62 : 1
        return Math.round(size * Math.min(1, share) * soFar)
      }),
    }
  })
}

export const DEMO: Record<Granularity, Cohort[]> = { week: cohorts('week'), month: cohorts('month') }

export const DEFAULT_COPY = {
  title: 'Retention',
  /** Under the title: what a cohort is, and the span. */
  description: (per: string, span: string) => `Cohorts by signup ${per} · ${span}`,
  per: { week: 'week', month: 'month' } as Record<Granularity, string>,
  granularity: 'Cohort size',
  granularities: { week: 'Weekly', month: 'Monthly' } as Record<Granularity, string>,
  measure: 'Show',
  measures: { percent: '%', people: 'People' } as Record<Measure, string>,
  measureNames: { percent: 'Percent', people: 'People' } as Record<Measure, string>,
  /** A period's column, "Week 3"; short in the grid's head, "W3". */
  period: { week: (n: number) => `Week ${n}`, month: (n: number) => `Month ${n}` } as Record<Granularity, (n: number) => string>,
  periodShort: { week: (n: number) => `W${n}`, month: (n: number) => `M${n}` } as Record<Granularity, (n: number) => string>,
  /** The periods the summary leads with. */
  keyPeriods: { week: [1, 4, 8], month: [1, 3, 5] } as Record<Granularity, number[]>,
  cohort: 'Cohort',
  people: 'People',
  average: 'Average',
  /** The grid's name. */
  grid: 'Retention by cohort',
  /** The chart's name and its lines. */
  chart: 'Retention curve',
  allCohorts: 'Each cohort',
  /** A cell for assistive tech: the cohort, the period, its share and count. */
  cell: (cohort: string, period: string, share: string, count: string, size: string, partial: boolean) =>
    `${cohort}, ${period}: ${share}, ${count} of ${size} people${partial ? ', in progress' : ''}`,
  /** The readout over the chart while a cell is picked. */
  readout: (cohort: string, period: string, share: string, count: string, size: string) => `${cohort} · ${period}: ${share} (${count} of ${size})`,
  /** Its difference from the average at that period, in points. */
  versus: (points: string, above: boolean) => `${points} pts ${above ? 'above' : 'below'} average`,
  inProgress: 'in progress',
  /** The chart's summary for assistive tech. */
  summary: (cohorts: number, people: string, keys: string) => `${cohorts} cohorts, ${people} people. Average retention: ${keys}.`,
  loading: 'Loading retention',
  retry: 'Retry',
  empty: 'No cohorts yet',
  emptyDescription: 'A cohort appears once people sign up.',
}

export type RetentionCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale every figure and date is written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/** Each period's average share, weighted by cohort size, from the readings that are complete. */
export function averages(cohorts: Cohort[], partial: boolean) {
  const longest = Math.max(0, ...cohorts.map((c) => c.active.length))
  return Array.from({ length: longest }, (_, p) => {
    const done = cohorts.filter((c) => p < c.active.length - (partial && p > 0 ? 1 : 0))
    const size = done.reduce((t, c) => t + c.size, 0)
    return size ? done.reduce((t, c) => t + c.active[p]!, 0) / size : undefined
  })
}

/** An ISO date as a UTC time. */
export const timeOf = (date: string) => Date.parse(date.length <= 10 ? `${date}T00:00:00Z` : date)
