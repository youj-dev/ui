/* How Folio says when: in the index, on a letter, and when a letter set
 * aside comes back. Folio's clock is a fixed demo day read in UTC, so a server
 * and a browser in any time zone render the same text. */

const DAY = 86_400_000
const clock = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit' })
const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' })
const weekdayLong = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long' })
const shortDate = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })
const longDate = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' })

export const sameDay = (a: number, b: number) => Math.floor(a / DAY) === Math.floor(b / DAY)

/** The index's time column: the clock today, "Yesterday", the weekday this week, then the date. */
export function when(time: number, now: number) {
  if (sameDay(time, now)) return clock.format(time)
  if (sameDay(time, now - DAY)) return 'Yesterday'
  if (now - time < 6 * DAY) return weekday.format(time)
  return shortDate.format(time)
}

/** A letter's date line: "Today, 9:14 AM", or the whole date. */
export const dated = (time: number, now: number) => (sameDay(time, now) ? `Today, ${clock.format(time)}` : longDate.format(time))

/** When a set-aside letter comes back: "today", "tomorrow" or the weekday. */
export const backDay = (time: number, now: number) => (sameDay(time, now) ? 'today' : sameDay(time, now + DAY) ? 'tomorrow' : weekdayLong.format(time))

/** "tomorrow at 8:00 AM". */
export const back = (time: number, now: number) => `${backDay(time, now)} at ${clock.format(time)}`
