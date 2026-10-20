import type { ReactNode } from 'react'
import { BanknoteIcon, BuildingIcon, ChartAreaIcon, LandmarkIcon, PieChartIcon } from '@youj/icons'

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** A span of time the card can show: the switch's choice, the chart's date axis and the phrase after the change. */
export interface PortfolioPeriod {
  id: string
  /** On the switch: "1M". */
  label: string
  /** After the change: "past month". Default: none. */
  name?: string
  /** How the chart's date axis writes its three dates. Default: month and day. */
  axis?: Intl.DateTimeFormatOptions
}

export const PERIODS: PortfolioPeriod[] = [
  { id: '1M', label: '1M', name: 'past month', axis: { month: 'short', day: 'numeric' } },
  { id: '6M', label: '6M', name: 'past 6 months', axis: { month: 'short', day: 'numeric' } },
  { id: '1Y', label: '1Y', name: 'past year', axis: { month: 'short', year: '2-digit' } },
  { id: '5Y', label: '5Y', name: 'past 5 years', axis: { month: 'short', year: 'numeric' } },
  { id: 'max', label: 'Max', name: 'all time', axis: { month: 'short', year: 'numeric' } },
]

/** A part of the whole: what it is, how much it is worth and how it moved in each period. */
export interface PortfolioHolding {
  id: string
  /** What it is: "Equities". */
  name: string
  /** A glyph in its row. Default: none. */
  icon?: ReactNode
  /** How many items it is made of (`copy.holdings` words it). */
  count: number
  /** What it is worth today. */
  value: number
  /** Its change over each period (by period `id`), as a fraction (0.04 is +4%). */
  change: Record<string, number>
}

export interface PortfolioPoint {
  /** Milliseconds since the epoch. */
  t: number
  v: number
}

/** The last day of the series. */
const END = Date.UTC(2026, 9, 9)
const DAY = 86_400_000

/** Fictional asset classes and what they hold. */
export const HOLDINGS: PortfolioHolding[] = [
  {
    id: 'stocks',
    name: 'Equities',
    icon: <ChartAreaIcon size={16} />,
    count: 14,
    value: 21480.5,
    change: { '1M': -0.021, '6M': 0.094, '1Y': 0.168, '5Y': 0.81, max: 1.42 },
  },
  {
    id: 'funds',
    name: 'Index funds',
    icon: <PieChartIcon size={16} />,
    count: 5,
    value: 12940,
    change: { '1M': -0.004, '6M': 0.061, '1Y': 0.112, '5Y': 0.52, max: 0.88 },
  },
  {
    id: 'bonds',
    name: 'Bonds',
    icon: <LandmarkIcon size={16} />,
    count: 4,
    value: 7210.4,
    change: { '1M': 0.006, '6M': 0.018, '1Y': 0.034, '5Y': 0.071, max: 0.12 },
  },
  {
    id: 'property',
    name: 'Property trusts',
    icon: <BuildingIcon size={16} />,
    count: 3,
    value: 4120.28,
    change: { '1M': -0.017, '6M': -0.022, '1Y': 0.027, '5Y': 0.19, max: 0.33 },
  },
  {
    id: 'cash',
    name: 'Cash',
    icon: <BanknoteIcon size={16} />,
    count: 2,
    value: 2509,
    change: { '1M': 0.003, '6M': 0.017, '1Y': 0.038, '5Y': 0.11, max: 0.16 },
  },
]

export const TOTAL = HOLDINGS.reduce((sum, h) => sum + h.value, 0)

/** The portfolio's return over each period, as a fraction. */
export const CHANGES: Record<string, number> = { '1M': -0.012, '6M': 0.078, '1Y': 0.126, '5Y': 0.584, max: 0.912 }

/** How many points each period has, and the days between them. */
const SHAPE: Record<string, { count: number; days: number }> = {
  '1M': { count: 31, days: 1 },
  '6M': { count: 27, days: 7 },
  '1Y': { count: 53, days: 7 },
  '5Y': { count: 61, days: 30 },
  max: { count: 97, days: 30 },
}

/** A deterministic, smooth wobble that is zero at both ends, so every series meets its endpoints exactly: `count` points `days` apart, ending at `end`, from `total / (1 + change)` to `total`. */
export function build(seed: number, count: number, days: number, total: number, change: number, end = END): PortfolioPoint[] {
  const start = total / (1 + change)
  return Array.from({ length: count }, (_, i) => {
    const x = i / (count - 1)
    const wobble = (Math.sin(x * (9 + seed * 3.1) + seed) + 0.55 * Math.sin(x * (23 + seed * 2.3) + seed * 1.7)) * Math.sin(Math.PI * x)
    const v = start + (total - start) * x + Math.abs(total - start) * 0.22 * wobble + start * 0.012 * wobble
    return { t: end - (count - 1 - i) * days * DAY, v: Math.round(v * 100) / 100 }
  })
}

export const SERIES: Record<string, PortfolioPoint[]> = Object.fromEntries(
  PERIODS.map((p, i) => [p.id, build(i + 1, SHAPE[p.id]!.count, SHAPE[p.id]!.days, TOTAL, CHANGES[p.id]!)]),
)

/** The points every series is resampled to, so a period switch morphs point by point. */
export const POINTS = 60

/** `series` resampled to `count` evenly spaced points by linear interpolation, keeping both ends. */
export function resample(series: readonly PortfolioPoint[], count = POINTS): PortfolioPoint[] {
  if (series.length === 0) return []
  if (series.length === 1) return Array.from({ length: count }, () => ({ ...series[0]! }))
  return Array.from({ length: count }, (_, i) => {
    const at = (i / (count - 1)) * (series.length - 1)
    const lo = Math.floor(at)
    const hi = Math.min(series.length - 1, lo + 1)
    const f = at - lo
    const a = series[lo]!
    const b = series[hi]!
    return { t: a.t + (b.t - a.t) * f, v: a.v + (b.v - a.v) * f }
  })
}

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

export const DEFAULT_COPY = {
  title: 'Portfolio',
  valueLabel: 'Total value',
  valueInfo: 'Everything you hold at the last close, cash included. Figures here are made up for the demo.',
  investments: 'Investments',
  holdings: (count: number) => `${count} ${new Intl.PluralRules('en').select(count) === 'one' ? 'holding' : 'holdings'}`,
  loadingLabel: 'Loading the portfolio',
  emptyTitle: 'Nothing to show yet',
  emptyDescription: 'Once there is a value to track, its chart and parts show up here.',
  retry: 'Retry',
}

/** The demo's amounts: US dollars. */
export const MONEY: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' }

export type PortfolioCopy = typeof DEFAULT_COPY & {
  /** The locale every amount and date is written in (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
