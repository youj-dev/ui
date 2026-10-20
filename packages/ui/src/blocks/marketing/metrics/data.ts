/** A period the numbers can be shown for. */
export interface MetricsPeriod {
  id: string
  label: string
}

/** One metric's figures for one period. */
export interface MetricsDatum {
  value: number
  /** The change on the period before, as a fraction (0.124 is +12.4%). */
  delta?: number
  /** The trend through the period, oldest first. */
  series?: number[]
  /** What the field or the previous way compares at, in the metric's own unit: draws "ours against theirs" bars. */
  baseline?: number
}

/** A headline number, with every period's figures. */
export interface MetricsMetric {
  id: string
  label: string
  /** How the number is written (`Intl.NumberFormat` options: decimals, compact notation…). */
  format?: Intl.NumberFormatOptions
  /** A unit set smaller after the number ("%", "ms", "+"). */
  suffix?: string
  /** Which way is good: a rising uptime is, a rising latency isn't. Colors the change. Default 'up'. */
  better?: 'up' | 'down'
  /** What `baseline` is ("Industry median"). Default `copy.baseline`. */
  baselineLabel?: string
  /** Draw the two proportional bars of a baseline comparison. Turn off where the bars would mislead, as for a figure near 100%: the two values still show. Default true. */
  baselineBars?: boolean
  /** The id of the source in `sources` this figure cites. */
  source?: string
  /** Figures by period id. A period without one shows a dash. */
  values: Record<string, MetricsDatum>
}

/** A footnote: where a figure comes from. */
export interface MetricsSource {
  id: string
  text: string
  href?: string
}

export const PERIODS: MetricsPeriod[] = [
  { id: '30d', label: 'Last 30 days' },
  { id: '12m', label: 'Last 12 months' },
  { id: 'all', label: 'All time' },
]

const series = (...values: number[]) => values

export const METRICS: MetricsMetric[] = [
  {
    id: 'uptime',
    label: 'Uptime',
    format: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
    suffix: '%',
    baselineLabel: 'Industry median',
    baselineBars: false,
    source: 'status',
    values: {
      '30d': { value: 99.99, delta: 0.0003, baseline: 99.9, series: series(99.97, 99.99, 99.98, 100, 99.99, 99.99, 100) },
      '12m': { value: 99.99, delta: 0.0001, baseline: 99.9, series: series(99.98, 99.99, 99.97, 99.99, 100, 99.99, 99.99) },
      all: { value: 99.98, baseline: 99.9, series: series(99.9, 99.94, 99.96, 99.97, 99.98, 99.98, 99.98) },
    },
  },
  {
    id: 'ttfb',
    label: 'Median time to first byte',
    suffix: ' ms',
    better: 'down',
    baselineLabel: 'Typical origin',
    source: 'rum',
    values: {
      '30d': { value: 38, delta: -0.08, baseline: 190, series: series(44, 42, 41, 40, 39, 38, 38) },
      '12m': { value: 41, delta: -0.31, baseline: 190, series: series(71, 62, 58, 52, 47, 44, 41) },
      all: { value: 46, delta: -0.52, baseline: 190, series: series(96, 82, 71, 62, 54, 49, 46) },
    },
  },
  {
    id: 'requests',
    label: 'Requests served',
    format: { notation: 'compact', maximumFractionDigits: 1 },
    source: 'edge',
    values: {
      '30d': { value: 12_400_000_000, delta: 0.124, series: series(9.1, 9.8, 10.2, 10.9, 11.4, 12, 12.4) },
      '12m': { value: 118_000_000_000, delta: 0.86, series: series(41, 55, 66, 78, 92, 105, 118) },
      all: { value: 310_000_000_000, series: series(20, 60, 110, 170, 220, 270, 310) },
    },
  },
  {
    id: 'teams',
    label: 'Teams shipping',
    format: { notation: 'compact' },
    suffix: '+',
    values: {
      '30d': { value: 40_000, delta: 0.031, series: series(38.8, 39.1, 39.4, 39.6, 39.8, 40, 40.1) },
      '12m': { value: 40_000, delta: 0.74, series: series(23, 27, 31, 34, 36, 38, 40) },
      all: { value: 40_000, series: series(1, 4, 9, 17, 26, 34, 40) },
    },
  },
]

export const SOURCES: MetricsSource[] = [
  { id: 'status', text: 'Northwind status page, all regions, measured at the edge. Planned maintenance counts as downtime.', href: '#status' },
  { id: 'rum', text: 'Real-user measurements from opted-in sites, p50, mobile and desktop. Baseline: HTTP Archive, typical origin server.', href: '#methodology' },
  { id: 'edge', text: 'Edge request logs, deduplicated across regions.' },
]

export const DEFAULT_COPY = {
  eyebrow: 'By the numbers',
  title: 'Built for the traffic you’re hoping for',
  description: 'Real figures from the platform, for the period you choose. Every number says where it comes from.',
  /** Names the period control. */
  periodLabel: 'Period',
  /** The default label of a baseline bar. */
  baseline: 'Baseline',
  ours: 'Northwind',
  /** Announced when the period changes: "Showing: Last 12 months". */
  showing: (period: string) => `Showing: ${period}`,
  /** The visible and spoken change: "+12.4% on the previous period". */
  up: (percent: string) => `Up ${percent} on the previous period`,
  down: (percent: string) => `Down ${percent} on the previous period`,
  /** Shown for a metric with no figure in the period. */
  noData: 'No data for this period',
  /** Names the footnotes. */
  sourcesLabel: 'Sources',
  /** The superscript's link: "Source 2". */
  source: (n: number) => `Source ${n}`,
  /** The trend line's name: "Uptime, last 30 days". */
  trend: (label: string, period: string) => `${label}, ${period}`,
}
export type MarketingMetricsCopy = typeof DEFAULT_COPY
