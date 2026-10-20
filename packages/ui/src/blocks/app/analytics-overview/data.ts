import { dateTimeFormat } from '../../../lib/utils'
/* Fieldnote Supply's store numbers, computed for any span of days. Every
 * day's traffic, conversion and basket come from a seeded formula (a slow
 * trend, a season, a weekly rhythm and a little noise), so any range the
 * picker lands on has figures, and the same day always reads the same.
 * Pass your own `summary` (an `AnalyticsSummary` from your analytics API)
 * to the block instead. */

export interface DateSpan {
  from: Date
  to: Date
}

export type Metric = 'revenue' | 'orders' | 'visitors'
export type Channel = 'search' | 'direct' | 'email' | 'social' | 'referral'
export type Category = 'notebooks' | 'pens' | 'paper' | 'desk' | 'bags'

/** A day's (or a bucket's) traffic and sales. */
export interface Day {
  visitors: number
  orders: number
  revenue: number
}

export interface Point extends Day {
  /** The axis label: an hour, a day, a week's first day or a month. */
  label: string
}

export interface ProductRow {
  id: string
  name: string
  /** A category's `key`. */
  category: string
  /** Revenue this period, in the block's currency. */
  revenue: number
  units: number
  /** Revenue in the period before. */
  previous: number
  /** Revenue per bucket, for the row's sparkline. */
  trend: number[]
}

/** A revenue source, in the donut and its legend. */
export interface AnalyticsChannel {
  key: string
  label: string
  revenue: number
}

/** A product category, in the treemap. */
export interface AnalyticsCategory {
  key: string
  label: string
  revenue: number
}

/** Everything the overview shows for a span, with the same-length period before it. */
export interface Summary {
  span: DateSpan
  previousSpan: DateSpan
  days: number
  /** How the series is bucketed. */
  unit: 'hour' | 'day' | 'week' | 'month'
  totals: Day
  previousTotals: Day
  series: Point[]
  /** The previous period, bucketed the same way and aligned by index. */
  previousSeries: Point[]
  /** In legend order; each takes the next chart color. */
  channels: AnalyticsChannel[]
  /** Ranked by revenue; the top five are listed. */
  products: ProductRow[]
  /** Ranked by revenue; the first is highlighted. */
  categories: AnalyticsCategory[]
}

/** The store opened here; the picker starts at it. */
export const LAUNCH = new Date(2025, 0, 6)
/** "Today" until the browser's clock is read: the server and the first render agree on it, so a statically rendered page hydrates cleanly. */
export const FIRST_TODAY = new Date(2026, 5, 30)

const DAY_MS = 86_400_000
/** Local calendar day → a whole day number, stable across time zones and DST. */
const dayNumber = (d: Date) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS)
const dateOf = (n: number) => {
  const u = new Date(n * DAY_MS)
  return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate())
}
const LAUNCH_DAY = dayNumber(LAUNCH)

/** Deterministic noise in [0, 1). */
const noise = (n: number, salt: number) => {
  const x = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const ZERO: Day = { visitors: 0, orders: 0, revenue: 0 }

/** Sunday first; 1970-01-01 was a Thursday. */
const WEEKLY = [0.84, 1.03, 1.07, 1.05, 1.02, 0.97, 0.88]

export function daily(n: number): Day {
  if (n < LAUNCH_DAY) return ZERO
  const age = n - LAUNCH_DAY
  const trend = 1 + age * 0.0011
  const season = 1 + 0.14 * Math.sin((2 * Math.PI * (n - 300)) / 365)
  const visitors = Math.round(2400 * trend * season * WEEKLY[(n + 4) % 7]! * (0.88 + 0.24 * noise(n, 1)))
  const conversion = 0.026 + 0.0025 * Math.sin(n / 17 + 1) + 0.002 * (noise(n, 2) - 0.5)
  const orders = Math.round(visitors * conversion)
  const basket = 47 + 3 * Math.sin(n / 37 + 2) + 2.5 * noise(n, 3)
  return { visitors, orders, revenue: Math.round(orders * basket * 100) / 100 }
}

/** Share of a day's activity in each hour: quiet overnight, a lunch bump and an evening peak. */
const HOURS = Array.from({ length: 24 }, (_, h) => 0.15 + Math.exp(-((h - 12.5) ** 2) / 8) * 0.8 + Math.exp(-((h - 20.5) ** 2) / 6))
const HOURS_TOTAL = HOURS.reduce((a, b) => a + b, 0)

export const CHANNELS: Record<Channel, { label: string; base: number; swing: number; period: number }> = {
  search: { label: 'Organic search', base: 0.34, swing: 0.1, period: 41 },
  direct: { label: 'Direct', base: 0.24, swing: 0.06, period: 67 },
  email: { label: 'Email', base: 0.18, swing: 0.3, period: 13 },
  social: { label: 'Paid social', base: 0.14, swing: 0.25, period: 23 },
  referral: { label: 'Referral', base: 0.1, swing: 0.2, period: 53 },
}

export const CATEGORIES: Record<Category, string> = {
  notebooks: 'Notebooks',
  pens: 'Pens',
  paper: 'Paper',
  desk: 'Desk',
  bags: 'Bags',
}

const PRODUCTS: { id: string; name: string; category: Category; price: number; base: number; swing: number; period: number }[] = [
  { id: 'dot-a5', name: 'Dot grid notebook, A5', category: 'notebooks', price: 24, base: 0.16, swing: 0.12, period: 37 },
  { id: 'field-3', name: 'Field notebook, 3-pack', category: 'notebooks', price: 18, base: 0.1, swing: 0.3, period: 19 },
  { id: 'brass-pen', name: 'Brass bolt-action pen', category: 'pens', price: 64, base: 0.14, swing: 0.2, period: 45 },
  { id: 'gel-refills', name: 'Gel refills, 10-pack', category: 'pens', price: 12, base: 0.06, swing: 0.15, period: 29 },
  { id: 'fountain', name: 'Pocket fountain pen', category: 'pens', price: 42, base: 0.08, swing: 0.35, period: 61 },
  { id: 'letter-set', name: 'Cotton letter set', category: 'paper', price: 28, base: 0.07, swing: 0.4, period: 17 },
  { id: 'washi', name: 'Washi tape trio', category: 'paper', price: 14, base: 0.05, swing: 0.3, period: 23 },
  { id: 'desk-pad', name: 'Felt desk pad', category: 'desk', price: 56, base: 0.09, swing: 0.18, period: 53 },
  { id: 'tray', name: 'Walnut pen tray', category: 'desk', price: 38, base: 0.06, swing: 0.22, period: 31 },
  { id: 'roll', name: 'Waxed canvas pen roll', category: 'bags', price: 48, base: 0.11, swing: 0.25, period: 71 },
  { id: 'folio', name: 'Leather folio', category: 'bags', price: 89, base: 0.08, swing: 0.3, period: 43 },
]

const weight = (n: number, w: { base: number; swing: number; period: number }, salt: number) => w.base * (1 + w.swing * Math.sin(n / w.period + salt))

const shares = <T extends { base: number; swing: number; period: number }>(n: number, items: T[]) => {
  const ws = items.map((item, i) => weight(n, item, i * 1.7))
  const sum = ws.reduce((a, b) => a + b, 0)
  return ws.map((w) => w / sum)
}

const add = (a: Day, b: Day): Day => ({ visitors: a.visitors + b.visitors, orders: a.orders + b.orders, revenue: a.revenue + b.revenue })

const unitFor = (days: number): Summary['unit'] => (days <= 1 ? 'hour' : days <= 62 ? 'day' : days <= 400 ? 'week' : 'month')

/** Weeks count back from the last day, so only the oldest week can be short. */
function bucketKey(n: number, unit: Summary['unit'], last: number) {
  if (unit === 'day') return n
  if (unit === 'week') return last - Math.floor((last - n) / 7) * 7
  const d = dateOf(n)
  return d.getFullYear() * 12 + d.getMonth()
}

function bucket(first: number, last: number, unit: Summary['unit'], locale: string): Point[] {
  if (unit === 'hour') {
    const day = daily(first)
    const hour = dateTimeFormat(locale, { hour: 'numeric' })
    return HOURS.map((w, h) => {
      const share = w / HOURS_TOTAL
      const at = dateOf(first)
      at.setHours(h)
      return { label: hour.format(at), visitors: Math.round(day.visitors * share), orders: Math.round(day.orders * share), revenue: day.revenue * share }
    })
  }
  const label = dateTimeFormat(locale, unit === 'month' ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' })
  const points = new Map<number, Point>()
  for (let n = first; n <= last; n++) {
    const k = bucketKey(n, unit, last)
    const point = points.get(k) ?? { label: label.format(dateOf(n)), ...ZERO }
    points.set(k, { ...point, ...add(point, daily(n)) })
  }
  return [...points.values()]
}

export const spanDays = (span: DateSpan) => dayNumber(span.to) - dayNumber(span.from) + 1

/** Everything the page shows for a span, with the same-length period before it for comparison. */
export function summarise(span: DateSpan, locale: string): Summary {
  const first = dayNumber(span.from)
  const last = dayNumber(span.to)
  const days = last - first + 1
  const unit = unitFor(days)
  const prevFirst = first - days
  const prevLast = first - 1

  let totals = ZERO
  let previousTotals = ZERO
  const channels = new Map<Channel, number>()
  const products = PRODUCTS.map((p) => ({ ...p, revenue: 0, previous: 0, trend: new Map<number, number>() }))
  const channelKeys = Object.keys(CHANNELS) as Channel[]
  const channelList = channelKeys.map((k) => CHANNELS[k])

  for (let n = prevFirst; n <= last; n++) {
    const day = daily(n)
    const current = n >= first
    if (current) totals = add(totals, day)
    else previousTotals = add(previousTotals, day)
    const productShares = shares(n, products)
    products.forEach((p, i) => {
      const revenue = day.revenue * productShares[i]!
      if (!current) p.previous += revenue
      else {
        p.revenue += revenue
        const k = bucketKey(n, unit === 'hour' ? 'day' : unit, last)
        p.trend.set(k, (p.trend.get(k) ?? 0) + revenue)
      }
    })
    if (current) shares(n, channelList).forEach((s, i) => channels.set(channelKeys[i]!, (channels.get(channelKeys[i]!) ?? 0) + day.revenue * s))
  }

  const rows: ProductRow[] = products
    .map((p) => ({ id: p.id, name: p.name, category: p.category, revenue: p.revenue, units: Math.round(p.revenue / p.price), previous: p.previous, trend: [...p.trend.values()] }))
    .sort((a, b) => b.revenue - a.revenue)

  const categories = (Object.keys(CATEGORIES) as Category[])
    .map((key) => ({ key, label: CATEGORIES[key], revenue: rows.filter((r) => r.category === key).reduce((sum, r) => sum + r.revenue, 0) }))
    .sort((a, b) => b.revenue - a.revenue)

  return {
    span,
    previousSpan: { from: dateOf(prevFirst), to: dateOf(prevLast) },
    days,
    unit,
    totals,
    previousTotals,
    series: bucket(first, last, unit, locale),
    previousSeries: bucket(prevFirst, prevLast, unit, locale),
    channels: channelKeys.map((key) => ({ key, label: CHANNELS[key].label, revenue: channels.get(key) ?? 0 })),
    products: rows,
    categories,
  }
}

/** The value a metric takes for a day or a bucket; conversion and basket are ratios of the sums. */
export const conversionOf = (d: Day) => (d.visitors ? d.orders / d.visitors : 0)
export const basketOf = (d: Day) => (d.orders ? d.revenue / d.orders : 0)

/** Money formats leave the currency out: the block adds its `currency` (see `withCurrency`). */
export const usd: Intl.NumberFormatOptions = { style: 'currency', maximumFractionDigits: 0 }
export const usd2: Intl.NumberFormatOptions = { style: 'currency', minimumFractionDigits: 2, maximumFractionDigits: 2 }
export const count: Intl.NumberFormatOptions = { maximumFractionDigits: 0 }
export const percent: Intl.NumberFormatOptions = { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }

/** A format with the block's currency, when it's a money format that doesn't name one. */
export const withCurrency = (format: Intl.NumberFormatOptions, currency: string): Intl.NumberFormatOptions =>
  format.style === 'currency' && !format.currency ? { ...format, currency } : format

export const METRICS: Record<Metric, { format: Intl.NumberFormatOptions; axis: Intl.NumberFormatOptions }> = {
  revenue: { format: usd, axis: { style: 'currency', notation: 'compact', maximumFractionDigits: 1 } },
  orders: { format: count, axis: { notation: 'compact', maximumFractionDigits: 1 } },
  visitors: { format: count, axis: { notation: 'compact', maximumFractionDigits: 1 } },
}

/** A headline number: how to read it off a day's (or the period's) totals, how to format it and its chart color. */
export interface AnalyticsKpi {
  label: string
  value: (totals: Day) => number
  /** Money formats without a `currency` take the block's. */
  format: Intl.NumberFormatOptions
  tone: 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'
  /** Draws bars a bucket (sums and counts); without it a line (rates and averages). */
  bars?: boolean
}

export const KPIS: AnalyticsKpi[] = [
  { label: 'Revenue', value: (d) => d.revenue, format: usd, tone: 'chart-1', bars: true },
  { label: 'Orders', value: (d) => d.orders, format: count, tone: 'chart-2', bars: true },
  { label: 'Conversion rate', value: conversionOf, format: percent, tone: 'chart-3' },
  { label: 'Average order', value: basketOf, format: usd2, tone: 'chart-4' },
]

export const lastDays = (today: Date, days: number): DateSpan => ({ from: dateOf(dayNumber(today) - days + 1), to: dateOf(dayNumber(today)) })

/** "Sep 1 – 29, 2026"; one day reads as that day. Node's ICU pads the dash with thin spaces and a browser's doesn't, so they're made plain: the server's text must equal the browser's for hydration. */
export const formatSpan = (span: DateSpan, locale: string) =>
  dateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' })
    .formatRange(span.from, span.to)
    .replace(/[\u2009\u202f]/g, ' ')
