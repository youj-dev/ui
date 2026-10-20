import { relativeTimeFormat } from '../../../lib/utils'

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

/** How long before `now` a moment was, short and in the locale: "34 min. ago", "yesterday". Under a minute is "now". */
export function ago(locale: string, now: Date | string | number, moment: string) {
  const seconds = Math.round((new Date(moment).getTime() - new Date(now).getTime()) / 1000)
  const unit = UNITS.find(([, size]) => Math.abs(seconds) >= size)
  const format = relativeTimeFormat(locale, { numeric: 'auto', style: 'short' })
  return unit ? format.format(Math.round(seconds / unit[1]), unit[0]) : format.format(0, 'second')
}

/** A `YYYY-MM-DD` day shifted by whole days, as a Date at UTC midnight. */
export function addDays(start: string, days: number) {
  const [y = 1970, m = 1, d = 1] = start.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + days))
}
