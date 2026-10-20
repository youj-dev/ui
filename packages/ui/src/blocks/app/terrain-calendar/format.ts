import { dateTimeFormat, numberFormat } from '../../../lib/utils'
import type { TerrainCalendarMetric } from './data'

/* How the figures read, built once per locale: a day's measure and a week's
 * total as figures for StatValue (a number, its Intl format and any unit
 * Intl has none for), the same as a line of text (tooltip, legend) and as
 * it's spoken (the grid); and the dates the days are keyed by (calendar days,
 * so they're read in UTC). */

export interface Figure {
  value: number
  format: Intl.NumberFormatOptions
  unit?: string
}

/** A known Monday, to name the days of the week. */
const MONDAY = Date.UTC(2026, 3, 13)

export function formatsFor(locale: string, metrics: TerrainCalendarMetric[]) {
  const date = (options: Intl.DateTimeFormatOptions) => dateTimeFormat(locale, { ...options, timeZone: 'UTC' })
  const long = date({ weekday: 'long', month: 'short', day: 'numeric' })
  const short = date({ month: 'short', day: 'numeric' })
  const tiny = date({ weekday: 'short', month: 'short', day: 'numeric' })
  const month = date({ month: 'short' })
  const weekday = date({ weekday: 'long' })
  const weekdayShort = date({ weekday: 'short' })
  const at = (iso: string) => Date.parse(`${iso}T00:00:00Z`)
  const metricOf = (id: string) => metrics.find((m) => m.id === id) ?? metrics[0]
  const line = (id: string, value: number) => {
    const f = metricOf(id)?.format
    return f ? `${numberFormat(locale, f.options).format(value)}${f.unit ? ` ${f.unit}` : ''}` : ''
  }

  /** A day's measure, as a figure. */
  const day = (id: string, value: number): Figure => {
    const f = metricOf(id)?.format
    return { value, format: f?.options ?? {}, unit: f?.unit }
  }

  return {
    day,
    /** A week's (or any stretch's) total, as a figure: time in hours. */
    total(id: string, value: number): Figure {
      const total = metricOf(id)?.format.total
      return total ? { value: value / total.divideBy, format: total.options } : day(id, value)
    },
    /** A measure as one line: "1,305 load", "3h 5m", "92.1 km". */
    text: (id: string, value: number) => metricOf(id)?.format.text?.(value, locale) ?? line(id, value),
    /** A measure as it's spoken: "185 minutes", "92.1 kilometers". */
    spoken: (id: string, value: number) => metricOf(id)?.format.spoken?.(value, locale) ?? metricOf(id)?.format.text?.(value, locale) ?? line(id, value),
    /** "Saturday, Sep 19". */
    date: (iso: string) => long.format(at(iso)),
    /** "Sep 19". */
    short: (iso: string) => short.format(at(iso)),
    /** "Sat, Sep 19". */
    tiny: (iso: string) => tiny.format(at(iso)),
    /** "Sep". */
    month: (iso: string) => month.format(at(iso)),
    /** A day of the week by its count from Monday: "Monday", or "Mon" when `short`. */
    weekday: (day: number, brief = false) => (brief ? weekdayShort : weekday).format(MONDAY + day * 86_400_000),
  }
}

export type TerrainFormats = ReturnType<typeof formatsFor>
