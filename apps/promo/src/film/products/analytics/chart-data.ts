import type { ChartEvent, Driver, Week } from './data'
import { cumulative } from './series'

/* Fig. 1's numbers: the running total at every hour boundary of the week,
 * with last week, the eight-week range and, when a driver is open, the week
 * without it and the gap between the two. */

const HOUR = 3_600_000
const moment = new Intl.DateTimeFormat('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })

export interface ChartPoint {
  x: number
  now: number | null
  last: number
  without: number | null
  range: [number, number]
  gap: [number, number] | null
}

/** One point per hour boundary, Monday 00:00 to Sunday 24:00. */
export function chartData(week: Week, driver: Driver | null): ChartPoint[] {
  const now = [0, ...cumulative(week.hourly)]
  const last = [0, ...cumulative(week.lastHourly)]
  const without = driver ? [0, ...cumulative(week.hourly.map((v, h) => v - driver.effect[h]!))] : now
  return last.map((l, x) => {
    const open = x <= week.hoursIn
    const n = open ? now[x]! : null
    const w = open ? without[x]! : null
    return {
      x,
      now: n,
      last: l,
      without: w,
      range: [l * 0.92, l * 1.07],
      gap: n === null || w === null ? null : [Math.min(n, w), Math.max(n, w)],
    }
  })
}

/** Where the running total stood at a fractional hour. */
export function valueAt(data: ChartPoint[], x: number) {
  const a = data[Math.floor(x)]?.now ?? 0
  const b = data[Math.ceil(x)]?.now ?? a
  return a + (b - a) * (x - Math.floor(x))
}

/** "Tue 9:00 AM": a moment of the week. */
export const momentOf = (week: Week, x: number) => moment.format(week.start + x * HOUR)
export const eventTime = (week: Week, event: ChartEvent) => momentOf(week, event.at)
