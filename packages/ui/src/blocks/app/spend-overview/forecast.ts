import type { ForecastPoint } from '../../../components/ui/forecast-band'

export interface SpendForecast {
  /** The running total at the end of each elapsed day. */
  actual: number[]
  /** The running total for each remaining day of the period, with its likely range. */
  forecast: ForecastPoint[]
  /** What each remaining day adds: the mean of the last `window` days. */
  pace: number
  /** Where the total lands at the period's end, and its likely range. */
  projected: number
  low: number
  high: number
  /** The 1-based day of the period on which the total first reaches the limit (a day already gone, or one ahead); null if it never does. */
  crossesOn: number | null
  /** The total has already reached the limit. */
  crossed: boolean
}

interface ForecastInput {
  /** What was spent on each elapsed day, oldest first. */
  daily: readonly number[]
  /** The days in the period. */
  days: number
  /** The limit the total is held against. */
  limit: number
  /** How many of the latest days set the pace. Default 7. */
  window?: number
}

const cents = (n: number) => Math.round(n * 100) / 100

/**
 * Carries a running total to the end of its period on a straight line: every
 * remaining day adds the mean of the latest `window` days. The likely range
 * is one standard deviation of those days, growing with the square root of
 * the days ahead (independent days), and never dips below what is already spent.
 */
export function forecastSpend({ daily, days, limit, window = 7 }: ForecastInput): SpendForecast {
  const actual: number[] = []
  let total = 0
  for (const day of daily) actual.push(cents((total += day)))

  const recent = daily.slice(-Math.max(1, window))
  const pace = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0
  const spread = recent.length > 1 ? Math.sqrt(recent.reduce((sum, d) => sum + (d - pace) ** 2, 0) / (recent.length - 1)) : 0

  const spent = actual.at(-1) ?? 0
  const ahead = Math.max(0, days - daily.length)
  const forecast = Array.from({ length: ahead }, (_, i) => {
    const value = spent + pace * (i + 1)
    const band = spread * Math.sqrt(i + 1)
    return { value: cents(value), low: cents(Math.max(spent, value - band)), high: cents(value + band) }
  })

  const end = forecast.at(-1) ?? { value: spent, low: spent, high: spent }
  const reached = [...actual, ...forecast.map((p) => p.value)].findIndex((value) => value >= limit)
  return {
    actual,
    forecast,
    pace: cents(pace),
    projected: end.value,
    low: end.low,
    high: end.high,
    crossesOn: reached === -1 ? null : reached + 1,
    crossed: spent >= limit,
  }
}
