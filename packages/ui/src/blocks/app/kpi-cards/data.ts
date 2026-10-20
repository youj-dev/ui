/** One window the range switch offers. */
export interface Range {
  id: string
  /** On the switch: "30D". */
  label: string
  /** Spoken after the switch: "last 30 days". Default: the label. */
  name?: string
  /** After each tile's change: "vs. previous 30 days". Default: `copy.versus`. */
  comparison?: string
}
export const RANGES: Range[] = [
  { id: '7d', label: '7D', name: 'last 7 days', comparison: 'vs. previous 7 days' },
  { id: '30d', label: '30D', name: 'last 30 days', comparison: 'vs. previous 30 days' },
  { id: '90d', label: '90D', name: 'last 90 days', comparison: 'vs. previous 90 days' },
]
export const DEFAULT_RANGE = '30d'

/** How the tiles draw their numbers: figures only, a line, or a bar per bucket. */
export type Variant = 'minimal' | 'trend' | 'bars'

/** How long one bucket is, for the dates. */
export type Granularity = 'hour' | 'day' | 'week' | 'month'

export type Tone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

export interface Kpi {
  id: string
  label: string
  /** How it's measured, in the tip beside its label. */
  description?: string
  /** One reading per bucket, oldest first, aligned with `dates`. */
  series: number[]
  /** The period before, bucket for bucket: the line's ghost, the bars' ticks and each bucket's change. */
  previous?: number[]
  /** How the headline sums the series: `sum` (default), `average` or `last` (a level: subscribers, balance). */
  aggregate?: 'sum' | 'average' | 'last'
  /** The headline, when it isn't the series' aggregate (a rate weighted by volume). */
  value?: number
  /** The period before's headline, likewise. */
  previousValue?: number
  /** Intl.NumberFormat options: currency, percent, compact. */
  format?: Intl.NumberFormatOptions
  /** Words Intl has no unit for, small after the figure: "seats". */
  unit?: string
  /** Down is good (refunds, churn, latency): a fall takes the good ink. */
  invert?: boolean
  /** The line's or the bars' colour. Default: the chart colours in order. */
  tone?: Tone
}

/** The block's item types, under its name. */
export type KpiCardsKpi = Kpi
export type KpiCardsRange = Range
export type KpiCardsVariant = Variant
export type KpiCardsGranularity = Granularity

/* ── Demo data ─────────────────────────────────────────────────────────────
 * A software shop's last half year, a day at a time, from a seeded generator
 * so every visit draws the same: revenue, new customers, how many visitors
 * bought, and the share of orders refunded. Each range takes its buckets
 * (days, then weeks for 90 days) and the same span before as the
 * comparison. Today, 10 October 2026, is half over: its bucket is partial,
 * and so is the matching bucket before it, so the change is like for like. */

const DAY = 86_400_000
const TODAY = Date.UTC(2026, 9, 10)
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

interface Day {
  t: number
  revenue: number
  customers: number
  visitors: number
  orders: number
  refunds: number
}

const DAYS: Day[] = (() => {
  const random = seeded(29)
  const out: Day[] = []
  const first = TODAY - 200 * DAY
  // Rates drift a little from day to day rather than jumping: slow random walks.
  let convert = 0
  let refund = 0
  for (let t = first; t <= TODAY; t += DAY) {
    const growth = (t - first) / (TODAY - first)
    const weekday = new Date(t).getUTCDay()
    const weekend = weekday === 0 || weekday === 6
    const launch = t >= Date.UTC(2026, 8, 22) && t < Date.UTC(2026, 8, 26) ? 1.55 : 1
    const share = t === TODAY ? SO_FAR : 1
    convert = convert * 0.82 + (random() - 0.5) * 0.0016
    refund = refund * 0.85 + (random() - 0.5) * 0.0024
    const visitors = Math.round((5200 + growth * 1800) * (weekend ? 0.7 : 1) * (0.9 + random() * 0.2) * launch * share)
    const orders = Math.round(visitors * (0.029 + growth * 0.004 + convert + (weekend ? 0.0015 : 0)))
    out.push({
      t,
      visitors,
      orders,
      revenue: Math.round(orders * (11.5 + random() * 2.5)),
      customers: Math.round(orders * (0.62 + random() * 0.1)),
      // Expected refunds, not whole ones: a day's handful would make the rate jump.
      refunds: orders * (0.024 - growth * 0.006 + refund),
    })
  }
  return out
})()

const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10)

function kpisFor(range: string): { dates: string[]; granularity: Granularity; kpis: Kpi[] } {
  const weeks = range === '90d'
  const n = range === '7d' ? 7 : range === '30d' ? 30 : 13
  const span = weeks ? 7 * DAY : DAY
  const length = n * span
  // Buckets end today; a week runs to today from six days before.
  const starts = Array.from({ length: n }, (_, i) => TODAY + DAY - length + i * span)
  const bucket = (from: number) => DAYS.filter((d) => d.t >= from && d.t < from + span)
  const total = (days: Day[], key: keyof Omit<Day, 't'>) => days.reduce((a, d) => a + d[key], 0)
  const read = (offset: number) => {
    const days = starts.map((s) => bucket(s - offset))
    // The bucket before today's is cut to today's share, so a half day meets a half day.
    if (offset) days[n - 1] = days[n - 1]!.map((d, i, all) => (i === all.length - 1 ? scale(d, SO_FAR) : d))
    return {
      revenue: days.map((d) => total(d, 'revenue')),
      customers: days.map((d) => total(d, 'customers')),
      conversion: days.map((d) => total(d, 'orders') / Math.max(1, total(d, 'visitors'))),
      refunds: days.map((d) => total(d, 'refunds') / Math.max(1, total(d, 'orders'))),
      all: days.flat(),
    }
  }
  const now = read(0)
  const before = read(length)
  const rate = (days: Day[], top: keyof Omit<Day, 't'>, bottom: keyof Omit<Day, 't'>) => total(days, top) / Math.max(1, total(days, bottom))
  return {
    dates: starts.map(isoDay),
    granularity: weeks ? 'week' : 'day',
    kpis: [
      { id: 'revenue', label: 'Revenue', description: 'Paid orders, less refunds and tax.', series: now.revenue, previous: before.revenue, format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }, tone: 'chart-1' },
      { id: 'customers', label: 'New customers', description: 'First paid order from an account.', series: now.customers, previous: before.customers, tone: 'chart-2' },
      {
        id: 'conversion',
        label: 'Conversion',
        description: 'Visitors who placed an order.',
        series: now.conversion,
        previous: before.conversion,
        value: rate(now.all, 'orders', 'visitors'),
        previousValue: rate(before.all, 'orders', 'visitors'),
        format: { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 },
        tone: 'chart-3',
      },
      {
        id: 'refunds',
        label: 'Refund rate',
        description: 'Orders refunded in full or in part.',
        series: now.refunds,
        previous: before.refunds,
        value: rate(now.all, 'refunds', 'orders'),
        previousValue: rate(before.all, 'refunds', 'orders'),
        format: { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 },
        invert: true,
        tone: 'chart-4',
      },
    ],
  }
}

function scale(d: Day, share: number): Day {
  return { t: d.t, revenue: Math.round(d.revenue * share), customers: Math.round(d.customers * share), visitors: Math.round(d.visitors * share), orders: Math.round(d.orders * share), refunds: d.refunds * share }
}

export const DEMO = { '7d': kpisFor('7d'), '30d': kpisFor('30d'), '90d': kpisFor('90d') } as const satisfies Record<string, ReturnType<typeof kpisFor>>

/** The demo's data for a window; a window the demo doesn't know shows the default one. */
export const demoFor = (range: string): ReturnType<typeof kpisFor> => (DEMO as Record<string, ReturnType<typeof kpisFor> | undefined>)[range] ?? DEMO['30d']

export const DEFAULT_COPY = {
  title: 'Overview',
  range: 'Time range',
  /** After a tile's change, and a picked bucket's, when its range has no `comparison` of its own. */
  versus: 'vs. previous period',
  /** A bucket that is still filling. */
  soFar: 'so far',
  /** A bucket's week, "Week of Oct 5". */
  weekOf: (date: string) => `Week of ${date}`,
  /** The tip button beside a label: its name, with the definition. */
  about: (label: string, description: string) => `About ${label}: ${description}`,
  /** A tile's chart as a slider: its name, and one bucket read out. */
  scrub: (label: string) => `${label} by date`,
  point: (date: string, value: string, change: string) => (change ? `${date}: ${value}, ${change}` : `${date}: ${value}`),
  up: (change: string) => `up ${change}`,
  down: (change: string) => `down ${change}`,
  /** Spoken after the range changes: each tile's figure and change. */
  announcement: (range: string, figures: string) => `${range}. ${figures}.`,
  loading: 'Loading metrics',
  retry: 'Retry',
  empty: 'No metrics yet',
  emptyDescription: 'Figures appear here once the first orders come in.',
}

export type KpiCardsCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale every figure and date is written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/** A KPI's headline: its own `value`, else its series summed, averaged or the last reading. */
export function headline(series: number[], aggregate: Kpi['aggregate'] = 'sum', value?: number) {
  if (value !== undefined) return value
  if (!series.length) return 0
  if (aggregate === 'last') return series.at(-1)!
  const sum = series.reduce((a, b) => a + b, 0)
  return aggregate === 'average' ? sum / series.length : sum
}

/** An ISO date or date-time as a UTC time. */
export const timeOf = (date: string) => Date.parse(date.length <= 10 ? `${date}T00:00:00Z` : /[zZ]|[+-]\d\d:\d\d$/.test(date) ? date : `${date}Z`)
