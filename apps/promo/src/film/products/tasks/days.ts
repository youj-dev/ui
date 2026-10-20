/* The runway's calendar: days count from today, and read as "Wed 30". */

const DAY = 86_400_000
const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' })

/** Midnight at the start of today. */
export function startOfToday(now: number) {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export const dateOf = (today: number, day: number) => new Date(today + day * DAY + 12 * 3_600_000)

/** The day a date falls on, counted from today: by calendar date, so a clock change can't shift it. */
export function dayOf(today: number, date: Date) {
  const t = new Date(today)
  return Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(t.getFullYear(), t.getMonth(), t.getDate())) / DAY)
}

/** "Wed 30". */
export const dayLabel = (today: number, day: number) => {
  const date = dateOf(today, day)
  return `${weekday.format(date)} ${date.getDate()}`
}

/** "Wed 30 – Fri 2", from a start day to the day after the last. */
export const rangeLabel = (today: number, start: number, end: number) => (end - start <= 1 ? dayLabel(today, start) : `${dayLabel(today, start)} – ${dayLabel(today, end - 1)}`)

export const isWeekend = (today: number, day: number) => [0, 6].includes(dateOf(today, day).getDay())

export const daysWord = (n: number) => (n === 1 ? 'a day' : `${n} days`)
