import type { ForecastPoint } from '../../../components/ui/forecast-band'

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

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

/** One way the rest of the period could go: its label is the switch's, its id keys `forecasts` and each series' `projected`. */
export interface MonthForecastScenario {
  id: string
  label: string
}

export const SCENARIOS: MonthForecastScenario[] = [
  { id: 'pace', label: 'Current pace' },
  { id: 'savings', label: 'Savings plan' },
]

export type MonthForecastTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

/** One part of the total, drawn as a bar: what it has used so far and where each scenario lands it. */
export interface MonthForecastSeries {
  id: string
  /** Its name, set in mono. */
  name: string
  /** Used so far this period. */
  spent: number
  /** Where it lands at the period's end, by scenario id. */
  projected: Record<string, number>
  tone: MonthForecastTone
}

/** The period: September, 30 days, 19 of them gone. */
export const START = '2026-09-01'

/** Spend per elapsed day, about $420 a day and lighter at weekends. */
const DAILY = [412, 468, 455, 301, 288, 476, 490, 463, 471, 318, 296, 502, 488, 479, 495, 334, 305, 512, 497]

/** Per-day amounts as the running total at the end of each day. */
export const cumulative = (daily: readonly number[]) => daily.reduce<number[]>((sums, day) => [...sums, (sums.at(-1) ?? 0) + day], [])

/** The running total at the end of each elapsed day. */
export const ACTUAL = cumulative(DAILY)

/**
 * The rest of the period from each remaining day's amount, with a likely range that widens with each day out
 * (`spread` is the first day's width, in the data's unit).
 */
export function projectForecast(actual: readonly number[], daily: (i: number) => number, remaining = 11, spread = 160): ForecastPoint[] {
  let total = actual.at(-1) ?? 0
  return Array.from({ length: remaining }, (_, i) => {
    total += daily(i)
    const width = spread * Math.sqrt(i + 1) + spread * (25 / 160) * (i + 1)
    return { value: Math.round(total), low: Math.round(total - width * 0.8), high: Math.round(total + width) }
  })
}

export const FORECASTS: Record<string, ForecastPoint[]> = {
  // Today's pace, creeping up about $2 a day.
  pace: projectForecast(ACTUAL, (i) => 450 + 2 * i),
  // Reserved compute starts on the 22nd.
  savings: projectForecast(ACTUAL, (i) => (i < 2 ? 455 : 290)),
}

export const BUDGET = 12000
export const BUDGETS = [11000, 12000, 13000, 14000]
/** The scale's top, held across scenarios and budgets so the axis stays still. */
export const SCALE_MAX = 15000

export const SERIES: MonthForecastSeries[] = [
  { id: 'compute', name: 'compute', spent: 3700, projected: { pace: 6030, savings: 4700 }, tone: 'chart-5' },
  { id: 'storage', name: 'storage', spent: 1400, projected: { pace: 2280, savings: 2280 }, tone: 'chart-1' },
  { id: 'transfer', name: 'data-transfer', spent: 1130, projected: { pace: 1840, savings: 1840 }, tone: 'chart-3' },
  { id: 'databases', name: 'databases', spent: 1050, projected: { pace: 1700, savings: 1590 }, tone: 'chart-4' },
  { id: 'other', name: 'other', spent: 770, projected: { pace: 1260, savings: 1160 }, tone: 'chart-2' },
]

export const DEFAULT_COPY = {
  currency: 'USD',
  title: 'Cloud spend',
  subtitle: 'September · 30 days',
  more: 'More actions',
  exportCsv: 'Export CSV',
  viewDetails: 'View invoices',
  scenario: 'Forecast scenario',
  projected: 'Projected month end',
  over: (amount: string) => `Over by ${amount}`,
  under: (amount: string) => `Under by ${amount}`,
  likely: (low: string, high: string) => `likely ${low} – ${high}`,
  spent: 'Spent to date',
  budget: 'Budget',
  burn: 'Daily burn',
  daysLeft: 'Days left',
  chart: 'Cloud spend forecast for September',
  /** In place of the card's figures and chart while your data loads (read aloud). */
  loadingLabel: 'Loading the forecast',
  retry: 'Retry',
  emptyTitle: 'No data for this period yet',
  emptyDescription: 'The forecast appears once the first day is in.',
  breakdown: 'By service',
  spentKey: 'Spent',
  projectedKey: 'Projected',
  seriesRow: (name: string, spent: string, projected: string) => `${name}: ${spent} spent, ${projected} projected`,
  updated: 'Forecast updated 06:00 UTC',
  adjust: 'Adjust budget',
  budgetMenu: 'Monthly budget',
  setAlert: 'Set alert',
  settingAlert: 'Setting…',
  alertSet: 'Alert set',
  /** Spoken when the scenario or the budget changes. */
  announce: (projected: string, status: string) => `Projected ${projected}, ${status}.`,
}

export type MonthForecastCopy = typeof DEFAULT_COPY & {
  /** The locale every amount is written in (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
