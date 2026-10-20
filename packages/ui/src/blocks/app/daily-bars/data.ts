/** One day's reading. */
export interface DailyBarsDay {
  /** The calendar day, as an ISO date: `2026-09-17`. */
  date: string
  value: number
}

/** A note on one day, drawn as a callout over its bar. */
export interface DailyBarsNote {
  /** The day it explains: an ISO date matching one of the days. */
  date: string
  text: string
}

/** Every string the card shows or speaks. */
export const DEFAULT_COPY = {
  title: 'Daily visits',
  subtitle: 'fernhill.example',
  /** After the change, the comparison it is made with. */
  vsPrevious: 'vs previous period',
  chart: 'Visits per day',
  /** What the readout says for a day, and the callout's first line. */
  reading: (date: string, value: string) => `${date} · ${value}`,
  /** The tag at the end of the average line. */
  averageTag: (value: string) => `Avg ${value}`,
  topDay: 'Top day',
  dailyAverage: 'Daily average',
  quietest: 'Quietest day',
  empty: 'No visits in this period',
  summary: (total: string, days: number, topDate: string, top: string, average: string) =>
    `${total} visits over ${days} days, ${average} a day on average. The busiest day was ${topDate} with ${top}. Use the left and right arrow keys to read each day.`,
}

export type DailyBarsCopy = typeof DEFAULT_COPY & { locale: string }

/* ── Demo data ─────────────────────────────────────────────────────────────
 * September 2026 for a made-up site: steady weekday traffic that dips at the
 * weekends, one spike on the 17th, and the total of the 30 days before. */

const BASE = [
  596, 612, 540, 502, 470, 330, 296, 588, 621, 604, 573, 538, 342, 301, 615, 640, 1440, 802, 611, 360, 318, 596, 628, 611, 584, 547, 334, 288, 602, 619,
]

export const DAYS: DailyBarsDay[] = BASE.map((value, i) => ({ date: `2026-09-${String(i + 1).padStart(2, '0')}`, value }))

export const NOTES: DailyBarsNote[] = [{ date: '2026-09-17', text: 'Front-page feature' }]

/** The 30 days before September. */
export const PREVIOUS_TOTAL = 14_700
