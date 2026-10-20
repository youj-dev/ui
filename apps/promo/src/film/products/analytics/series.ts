/* The Ledger’s hour-by-hour maths: a tea shop’s ordinary week, the shapes
 * a driver can take (a surge after a send, orders in lumps, an outage, small
 * drift), and the calendar of Monday-based ISO weeks. No randomness, so every
 * run draws the same lines. */

export const HOURS = 168
const HOUR = 3_600_000
const DAY = 24 * HOUR

/** A tea shop's day: quiet overnight, a morning cup, a dip after lunch, and the evening, when most people browse. */
export const DAY_SHAPE = [0.9, 0.5, 0.3, 0.25, 0.3, 0.6, 1.6, 3.4, 5.2, 5.8, 5.4, 5, 5.2, 4.8, 4.4, 4.2, 4.5, 5, 5.6, 6.4, 7, 6.2, 4.2, 2.2]
/** Monday to Sunday: Sunday evenings are the busiest of the week. */
const WEEKDAY = [1, 1.02, 0.99, 1.03, 0.95, 0.88, 1.13]

/** A smooth, repeatable wobble: no randomness, so every run draws the same line. */
const wobble = (i: number, a: number, b: number) => Math.sin(i * a) * 0.5 + Math.sin(i * b + 1.3) * 0.5

export const sum = (values: number[]) => values.reduce((n, v) => n + v, 0)
export const scaleTo = (values: number[], total: number) => {
  const s = sum(values)
  return values.map((v) => (s ? (v * total) / s : 0))
}
export const hours = (fn: (h: number) => number) => Array.from({ length: HOURS }, (_, h) => fn(h))

/** A week's ordinary trade, hour by hour, summing to `total`. */
export function baseline(total: number, seed: number) {
  return scaleTo(
    hours((h) => DAY_SHAPE[h % 24]! * WEEKDAY[Math.floor(h / 24)]! * (1 + 0.07 * wobble(h + seed, 0.37, 1.1))),
    total,
  )
}

/* Effect shapes, before they're scaled to a driver's amount. */
/** A send or a story: a jump at `from` that fades over `tau` hours, still following the day's rhythm. */
export const surge = (from: number, tau: number) => hours((h) => (h < from ? 0 : Math.exp(-(h - from) / tau) * (0.4 + DAY_SHAPE[h % 24]! / 7)))
/** Orders that arrive in lumps: [hour, weight] pairs. */
export const lumps = (points: [number, number][]) => hours((h) => sum(points.filter(([at]) => at === h).map(([, w]) => w)))
/** Money lost while something was down: the trade in each hour of the window (part hours included), and a share of a send's momentum after it. */
export const outage = (from: number, to: number, trade: number[], momentum: number[]) =>
  hours((h) => Math.max(0, Math.min(h + 1, to) - Math.max(h, from)) * trade[h]! + (h >= to && h < to + 6 ? 0.4 * momentum[h]! : 0))
/** Small changes spread over the week. */
export const drift = (seed: number) => hours((h) => (0.6 + 0.4 * wobble(h + seed, 0.21, 0.83)) * (0.3 + DAY_SHAPE[h % 24]! / 7))

export const at = (day: number, hour: number, minute = 0) => day * 24 + hour + minute / 60

/** Monday 00:00 of the week `offset` weeks back from the one containing `now`. */
export function weekStart(now: number, offset = 0) {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - offset * 7)
  return d.getTime()
}

/** ISO 8601 week number of the week starting on `monday`. */
export function isoWeek(monday: number) {
  const thursday = new Date(monday + 3 * DAY)
  const jan4 = new Date(thursday.getFullYear(), 0, 4)
  return 1 + Math.round((thursday.getTime() - weekStart(jan4.getTime())) / (7 * DAY))
}

/** Running totals of an hourly series. */
export function cumulative(values: number[]) {
  let total = 0
  return values.map((v) => (total += v))
}
