/** One window the range switch offers. */
export interface Range {
  id: string
  /** On the switch: "30D". */
  label: string
  /** Spoken after the switch: "last 30 days". Default: the label. */
  name?: string
  /** After the change: "vs. previous 30 days". Default: `copy.versus`. */
  comparison?: string
}
export const RANGES: Range[] = [
  { id: '7d', label: '7D', name: 'last 7 days', comparison: 'vs. previous 7 days' },
  { id: '30d', label: '30D', name: 'last 30 days', comparison: 'vs. previous 30 days' },
  { id: '90d', label: '90D', name: 'last 90 days', comparison: 'vs. previous 90 days' },
  { id: '12m', label: '12M', name: 'last 12 months', comparison: 'vs. a year before' },
]
export const DEFAULT_RANGE = '30d'

/** How long one point of the chart is. */
export type Granularity = 'hour' | 'day' | 'week' | 'month'

export type Tone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'
export type AnnotationTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'

export interface Series {
  id: string
  label: string
  /** Its colour. Default: the chart colours in order. */
  tone?: Tone
}

export interface Point {
  /** When the bucket starts: an ISO date (`2026-10-03`), or date and time for hourly points (`2026-10-03T14:00`), read as UTC. */
  date: string
  /** The bucket's reading for each series, by series id. */
  values: Record<string, number>
  /** The same bucket of the period before, by series id: the dashed comparison line. */
  previous?: Record<string, number>
}

export interface Annotation {
  id: string
  /** The day (or moment) it happened; it pins to the bucket that holds it. */
  date: string
  label: string
  /** A sentence on what happened, in its tip and its accessible name. */
  description?: string
  /** Default `neutral`. */
  tone?: AnnotationTone
}

/** The block's item types, under its name. */
export type MetricChartRange = Range
export type MetricChartGranularity = Granularity
export type MetricChartSeries = Series
export type MetricChartPoint = Point
export type MetricChartAnnotation = Annotation

/* ── Demo data ─────────────────────────────────────────────────────────────
 * Two years of daily signups for one product, by channel, drawn from a seeded
 * generator so every visit draws the same: weekends quieter, slow growth,
 * a launch week, an outage and the new pricing page. Each range is bucketed
 * from it (days, then weeks for 90 days, then months), with the same span
 * before it as the comparison. Today is 10 October 2026, half over: its
 * bucket is partial, and the comparison's matching bucket is cut to the same
 * share, so the change compares like with like. */

const DAY = 86_400_000
const ORIGIN = Date.UTC(2024, 9, 1)
const TODAY = Date.UTC(2026, 9, 10)
/** How much of today has happened. */
const SO_FAR = 0.55

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

const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10)
const at = (iso: string) => Date.parse(`${iso}T00:00:00Z`)

/** A boost that peaks on `day` and fades over `days`. */
const pulse = (t: number, day: string, days: number, size: number) => {
  const d = (t - at(day)) / DAY
  return d < 0 || d > days ? 1 : 1 + size * (1 - d / days)
}

/** Signups per channel for every day from ORIGIN to TODAY, today cut to SO_FAR. */
const DAYS = (() => {
  const random = seeded(11)
  const out: { t: number; organic: number; paid: number; referral: number }[] = []
  for (let t = ORIGIN; t <= TODAY; t += DAY) {
    const growth = (t - ORIGIN) / (TODAY - ORIGIN)
    const weekday = new Date(t).getUTCDay()
    const weekend = weekday === 0 || weekday === 6
    const noise = () => 0.9 + random() * 0.2
    const launch = pulse(t, '2026-09-22', 5, 1.1)
    const outage = isoDay(t) === '2026-09-29' ? 0.42 : 1
    const pricing = t >= at('2026-10-03') ? 1.12 : 1
    const referralProgram = t >= at('2026-07-14') ? 1.7 : 1
    const campaign = pulse(t, '2026-03-02', 21, 0.6)
    const share = t === TODAY ? SO_FAR : 1
    out.push({
      t,
      organic: Math.round((150 + growth * 120) * (weekend ? 0.68 : 1) * noise() * launch * outage * pricing * share),
      paid: Math.round((70 + growth * 60) * (weekend ? 0.82 : 1) * noise() * campaign * pulse(t, '2026-09-22', 4, 0.5) * outage * pricing * share),
      referral: Math.round((16 + growth * 14) * referralProgram * noise() * outage * share),
    })
  }
  return out
})()

export const SERIES: Series[] = [
  { id: 'organic', label: 'Organic search', tone: 'chart-1' },
  { id: 'paid', label: 'Paid', tone: 'chart-2' },
  { id: 'referral', label: 'Referral', tone: 'chart-3' },
]

type Day = (typeof DAYS)[number]
const sum = (days: Day[]) => ({
  organic: days.reduce((a, d) => a + d.organic, 0),
  paid: days.reduce((a, d) => a + d.paid, 0),
  referral: days.reduce((a, d) => a + d.referral, 0),
})
const daysBetween = (from: number, to: number) => DAYS.filter((d) => d.t >= from && d.t < to)
const monthStart = (t: number, back: number) => {
  const d = new Date(t)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - back, 1)
}

/** One range's buckets: start times, each bucket's end, and the comparison's start. */
function buckets(range: string): { starts: number[]; ends: number[]; before: (i: number) => [number, number] } {
  if (range === '12m') {
    const starts = Array.from({ length: 12 }, (_, i) => monthStart(TODAY, 11 - i))
    const ends = starts.map((s, i) => (i === 11 ? TODAY + DAY : monthStart(s, -1)))
    // The same month a year before, to the same day for the month in progress.
    return { starts, ends, before: (i) => [monthStart(starts[i]!, 12), i === 11 ? monthStart(starts[i]!, 12) + (ends[i]! - starts[i]!) : monthStart(starts[i]!, 11)] }
  }
  if (range === '90d') {
    // Thirteen weeks, Monday to Sunday, the last one this week so far.
    const monday = TODAY - ((new Date(TODAY).getUTCDay() + 6) % 7) * DAY
    const starts = Array.from({ length: 13 }, (_, i) => monday - (12 - i) * 7 * DAY)
    const ends = starts.map((s, i) => (i === 12 ? TODAY + DAY : s + 7 * DAY))
    return { starts, ends, before: (i) => [starts[i]! - 91 * DAY, ends[i]! - 91 * DAY] }
  }
  const n = range === '7d' ? 7 : 30
  const starts = Array.from({ length: n }, (_, i) => TODAY - (n - 1 - i) * DAY)
  return { starts, ends: starts.map((s) => s + DAY), before: (i) => [starts[i]! - n * DAY, starts[i]! - n * DAY + DAY] }
}

function demoPoints(range: string): Point[] {
  const { starts, ends, before } = buckets(range)
  return starts.map((start, i) => {
    const [from, to] = before(i)
    const prev = sum(daysBetween(from, to))
    // The comparison's matching day is cut to today's share, so a half day is compared with a half day.
    const cut = ends[i] === TODAY + DAY && range !== '12m' && range !== '90d' ? SO_FAR : 1
    return {
      date: isoDay(start),
      values: sum(daysBetween(start, ends[i]!)),
      previous: { organic: Math.round(prev.organic * cut), paid: Math.round(prev.paid * cut), referral: Math.round(prev.referral * cut) },
    }
  })
}

type Demo = { points: Point[]; granularity: Granularity }
export const DEMO = {
  '7d': { points: demoPoints('7d'), granularity: 'day' },
  '30d': { points: demoPoints('30d'), granularity: 'day' },
  '90d': { points: demoPoints('90d'), granularity: 'week' },
  '12m': { points: demoPoints('12m'), granularity: 'month' },
} as const satisfies Record<string, Demo>

/** The demo's data for a window; a window the demo doesn't know shows the default one. */
export const demoFor = (range: string): Demo => (DEMO as Record<string, Demo | undefined>)[range] ?? DEMO['30d']

export const ANNOTATIONS: Annotation[] = [
  { id: 'campaign', date: '2026-03-02', label: 'Spring campaign', description: 'Three weeks of paid search and social.', tone: 'info' },
  { id: 'referrals', date: '2026-07-14', label: 'Referral program', description: 'Invite a teammate, both get a month free.', tone: 'accent' },
  { id: 'launch', date: '2026-09-22', label: 'Launch week', description: 'Five launches in five days, and the front page of Product Hunt.', tone: 'accent' },
  { id: 'outage', date: '2026-09-29', label: 'Signup outage', description: 'Verification emails failed for three hours.', tone: 'danger' },
  { id: 'pricing', date: '2026-10-03', label: 'Pricing page v2', description: 'The new page with the yearly toggle went live.', tone: 'success' },
]

export const DEFAULT_COPY = {
  title: 'Signups',
  /** The period shown and how long a point is: "Sep 11 – Oct 10 · daily". */
  description: (period: string, per: string) => `${period} · ${per}`,
  per: { hour: 'hourly', day: 'daily', week: 'weekly', month: 'monthly' } as Record<Granularity, string>,
  range: 'Time range',
  /** After the change, and a picked bucket's, when its range has no `comparison` of its own. */
  versus: 'vs. previous period',
  /** A bucket that is still filling. */
  soFar: 'so far',
  partial: 'So far',
  /** A bucket's week, "Week of Oct 5". */
  weekOf: (date: string) => `Week of ${date}`,
  previous: 'Previous period',
  series: 'Series',
  /** Spoken when a series is shown or hidden, shown alone, or all shown again. */
  shown: (label: string) => `${label} shown`,
  hidden: (label: string) => `${label} hidden`,
  only: (label: string) => `Only ${label} shown`,
  allShown: 'Every series shown',
  /** The chart as a slider: its name, and one point read out. */
  scrub: (title: string) => `${title} by date`,
  point: (date: string, total: string, parts: string) => `${date}: ${total}. ${parts}`,
  annotations: 'Annotations',
  more: 'More actions',
  download: 'Download CSV',
  copyLink: 'Copy link',
  /** The data table's caption. */
  table: (title: string, period: string) => `${title}, ${period}`,
  dateColumn: 'Date',
  /** The switch between the plot and its numbers as a table, in the plot's place. */
  viewData: 'View data',
  hideData: 'Hide data',
  /** The chart's summary for assistive tech. */
  summary: (title: string, period: string, total: string, change: string, peak: string, notes: string) =>
    `${title}, ${period}: ${total} in all, ${change}. Highest: ${peak}.${notes ? ` Marked: ${notes}.` : ''}`,
  up: (change: string) => `up ${change}`,
  down: (change: string) => `down ${change}`,
  flat: 'unchanged',
  /** Spoken after the range changes. */
  announcement: (range: string, total: string, change: string) => `${range}: ${total}, ${change}.`,
  empty: 'No signups in this range',
  emptyDescription: 'Pick a longer range, or check that events are arriving.',
  allHidden: 'Every series is hidden.',
  showAll: 'Show all',
  error: "Signups couldn't be loaded.",
  retry: 'Retry',
  loading: 'Loading signups',
}

export type MetricChartCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale every figure and date is written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/* ── Helpers ────────────────────────────────────────────────────────────── */

/** An ISO date or date-time as a UTC time. */
export const timeOf = (date: string) => Date.parse(date.length <= 10 ? `${date}T00:00:00Z` : /[zZ]|[+-]\d\d:\d\d$/.test(date) ? date : `${date}Z`)

/** A round top for the axis and its ticks: four steps of 1, 2, 2.5 or 5 times a power of ten. */
export function niceScale(max: number, steps = 4) {
  if (!(max > 0)) return { top: steps, ticks: Array.from({ length: steps + 1 }, (_, i) => i) }
  const raw = max / steps
  const power = 10 ** Math.floor(Math.log10(raw))
  const n = raw / power
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * power
  const top = step * Math.ceil(max / step - 1e-9)
  return { top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) }
}

/** The bucket each annotation pins to: the last one starting on or before it, if it falls in the range. */
export function place(annotations: Annotation[], points: Point[], granularity: Granularity) {
  const starts = points.map((p) => timeOf(p.date))
  const span = { hour: 3_600_000, day: DAY, week: 7 * DAY, month: 31 * DAY }[granularity]
  const placed = new Map<number, Annotation[]>()
  for (const a of annotations) {
    const t = timeOf(a.date)
    let index = -1
    for (let i = 0; i < starts.length; i++) if (starts[i]! <= t) index = i
    if (index < 0 || t >= (starts[index + 1] ?? starts[index]! + span)) continue
    placed.set(index, [...(placed.get(index) ?? []), a])
  }
  return placed
}
