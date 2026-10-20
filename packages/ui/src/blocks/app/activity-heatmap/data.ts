export type View = 'days' | 'hours'

export interface Day {
  /** The day, as an ISO date (YYYY-MM-DD), read as UTC. */
  date: string
  /** What happened that day: orders, commits, deploys. */
  value: number
}

/** The block's item types, under its name. */
export type ActivityHeatmapDay = Day
export type ActivityHeatmapView = View

const DAY = 86_400_000

/** An ISO date as a UTC time. */
export const timeOf = (date: string) => Date.parse(date.length <= 10 ? `${date}T00:00:00Z` : date)
const iso = (t: number) => new Date(t).toISOString().slice(0, 10)

/* ── Demo data ─────────────────────────────────────────────────────────────
 * A small shop's orders per day for a year, to Saturday 10 October 2026
 * (today, half done), from a seeded generator so every visit draws the
 * same. Weekends sell more; it grows a quarter over the year; Black Friday
 * and Cyber Monday spike and December runs hot, January is slow, a spring
 * sale lifts March, and the week of 10 August the shop was closed to move
 * warehouses, which ended a 165-day run at its 25-a-day goal. The hours are
 * the same shop's average orders in each hour of the week. */

export const TODAY = '2026-10-10'
export const GOAL = 25

function seeded(seed: number) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** Each weekday's pull, Sunday first. */
const WEEKDAY = [1.1, 0.9, 0.86, 0.92, 0.98, 1.08, 1.24]
const SEASONS: [string, string, number][] = [
  ['2025-11-01', '2025-11-26', 1.12],
  ['2025-11-27', '2025-11-27', 0.8],
  ['2025-11-28', '2025-11-28', 4.6],
  ['2025-11-29', '2025-11-29', 2.5],
  ['2025-11-30', '2025-11-30', 2.1],
  ['2025-12-01', '2025-12-01', 3.7],
  ['2025-12-02', '2025-12-07', 1.6],
  ['2025-12-08', '2025-12-19', 1.42],
  ['2025-12-20', '2025-12-23', 1.15],
  ['2025-12-24', '2025-12-24', 0.5],
  ['2025-12-25', '2025-12-25', 0.14],
  ['2025-12-26', '2025-12-26', 0.6],
  ['2025-12-27', '2025-12-31', 0.8],
  ['2026-01-01', '2026-01-01', 0.22],
  ['2026-01-02', '2026-01-31', 0.74],
  ['2026-02-01', '2026-02-28', 0.88],
  ['2026-03-16', '2026-03-22', 1.85],
  ['2026-07-01', '2026-07-31', 0.86],
  ['2026-08-01', '2026-08-09', 0.8],
  ['2026-08-10', '2026-08-16', 0],
  ['2026-08-17', '2026-08-31', 0.84],
  ['2026-09-15', '2026-09-28', 1.45],
  ['2026-09-29', '2026-10-10', 1.16],
]

function demoDays(): Day[] {
  const random = seeded(29)
  const start = Date.UTC(2025, 8, 28)
  const end = timeOf(TODAY)
  const days: Day[] = []
  for (let t = start; t <= end; t += DAY) {
    const date = iso(t)
    const trend = 1 + 0.24 * ((t - start) / (end - start))
    const season = SEASONS.find(([from, to]) => date >= from && date <= to)?.[2] ?? 1
    const value = Math.round(31 * trend * WEEKDAY[new Date(t).getUTCDay()]! * season * (0.84 + random() * 0.32))
    days.push({ date, value: t === end ? Math.round(value * 0.62) : value })
  }
  return days
}

/** Share of a day's orders in each hour, midnight first: a working day, and a weekend that starts later. */
const WORKDAY = [16, 9, 6, 5, 6, 11, 20, 34, 45, 50, 53, 58, 66, 61, 52, 48, 47, 50, 57, 68, 82, 87, 70, 40]
const WEEKEND = [22, 14, 8, 5, 4, 5, 8, 15, 27, 42, 55, 62, 66, 64, 60, 57, 55, 56, 60, 70, 83, 90, 76, 45]

function demoHours(): number[][] {
  const random = seeded(7)
  return WEEKDAY.map((pull, weekday) => {
    const shape = weekday === 0 || weekday === 6 ? WEEKEND : WORKDAY
    const sum = shape.reduce((t, s) => t + s, 0)
    return shape.map((s) => Math.round(((35.6 * pull * s) / sum) * (0.92 + random() * 0.16) * 10) / 10)
  })
}

export const DAYS = demoDays()
/** Average orders per day in each hour of the week: Sunday first, midnight first. */
export const HOURS = demoHours()

const plural = new Intl.PluralRules('en')
const orders = (n: number) => (plural.select(n) === 'one' ? 'order' : 'orders')

export const DEFAULT_COPY = {
  title: 'Order activity',
  /** Under the title: what a cell is, and the span. */
  description: {
    days: (span: string) => `Orders per day · ${span}`,
    hours: (span: string) => `Orders in each hour, a day on average · ${span}`,
  } as Record<View, (span: string) => string>,
  /** The switch between the views, and their names. */
  view: 'View',
  views: { days: 'Days', hours: 'Hours' } as Record<View, string>,
  /** The figures over the grid. */
  total: 'Orders',
  activeDays: (days: string) => `on ${days} days`,
  average: 'Daily average',
  /** Under the average: the weekday that sells most. */
  weekday: (weekday: string) => `${weekday} is busiest`,
  busiestDay: 'Busiest day',
  busiestHour: 'Busiest hour',
  streak: 'Streak',
  /** The streak's unit, after its figure. */
  days: (n: number) => (plural.select(n) === 'one' ? 'day' : 'days'),
  /** Under the streak: the longest, and the daily goal it counts against. */
  best: (best: string, goal: string) => `best ${best}${goal ? ` · ${goal}+ a day` : ''}`,
  /** The grid's name. */
  grid: { days: 'Orders per day', hours: 'Orders in each hour of the week' } as Record<View, string>,
  /** A value with its noun, "412 orders"; an hour's is a day's average. */
  count: { days: (value: string, n: number) => `${value} ${orders(n)}`, hours: (value: string, n: number) => `${value} ${orders(n)} a day` } as Record<View, (value: string, n: number) => string>,
  /** Said after today's value. */
  soFar: 'so far',
  /** A cell for assistive tech: when, and its value. */
  cell: (when: string, count: string, today: boolean) => `${when}: ${count}${today ? ', today so far' : ''}`,
  /** The legend: its name, its ends, and each step for assistive tech ("29–33"). */
  legend: 'Show only',
  less: 'Less',
  more: 'More',
  none: { days: 'Days with no orders', hours: 'Hours with no orders' } as Record<View, string>,
  step: { days: (range: string) => `Days with ${range} orders`, hours: (range: string) => `Hours with ${range} orders a day` } as Record<View, (range: string) => string>,
  /** A step's range: "29–33", or "40+" for the top. */
  range: (from: string, to: string) => `${from}–${to}`,
  atLeast: (from: string) => `${from}+`,
  /** Shown and spoken while a step is picked: the step, and how many it holds. */
  showing: (step: string, count: string) => `${step}: ${count}`,
  showingAll: 'Showing all',
  /** Under the grid while no step is picked: why one record day doesn't pale the rest. */
  scale: 'Each step holds a quarter of the active days',
  /** The grid's summary for assistive tech. */
  summary: {
    days: (total: string, weeks: number, busiest: string, weekday: string) => `${total} over ${weeks} weeks. Busiest day: ${busiest}. ${weekday} is busiest.`,
    hours: (busiest: string, quietest: string) => `Busiest hour: ${busiest}. Quietest: ${quietest}.`,
  },
  loading: 'Loading activity',
  retry: 'Retry',
  empty: 'No activity yet',
  emptyDescription: 'Days fill in as orders come in.',
}

export type ActivityHeatmapCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale every figure and date is written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/** Where steps two to four start: the quartiles of the active values, rounded so the legend reads cleanly, so one record day can't pale the rest. */
export function quartiles(values: number[]) {
  const active = values.filter((v) => v > 0).sort((a, b) => a - b)
  if (active.length === 0) return []
  const at = (p: number) => {
    const i = p * (active.length - 1)
    const lo = Math.floor(i)
    return active[lo]! + (active[Math.min(lo + 1, active.length - 1)]! - active[lo]!) * (i - lo)
  }
  const whole = active.every(Number.isInteger)
  const floors: number[] = []
  for (const p of [0.25, 0.5, 0.75]) {
    const f = whole ? Math.ceil(at(p)) : Number(at(p).toPrecision(2))
    if (f > (floors.at(-1) ?? active[0]!)) floors.push(f)
  }
  return floors
}

/** A value's step: 0 for none, then one more for each floor it reaches. */
export const levelOf = (value: number, floors: number[]) => (value <= 0 ? 0 : 1 + floors.filter((f) => value >= f).length)

/** The run of days meeting the goal (any activity without one) up to today, which counts once it meets it, and the longest run. */
export function streaks(values: number[], goal: number | undefined) {
  const meets = (v: number) => (goal === undefined ? v > 0 : v >= goal)
  let run = 0
  let best = 0
  for (const v of values) {
    run = meets(v) ? run + 1 : 0
    best = Math.max(best, run)
  }
  let current = 0
  for (let i = values.length - (values.length && !meets(values.at(-1)!) ? 2 : 1); i >= 0 && meets(values[i]!); i--) current++
  return { current, best }
}

/** The grid's weeks: `weeks` columns of seven days ending with today's week, each day its date and value; days after today are null. */
export function calendar(values: Map<string, number>, today: number, weeks: number, weekStart: number) {
  const back = (new Date(today).getUTCDay() - weekStart + 7) % 7
  const first = today - (back + (weeks - 1) * 7) * DAY
  const columns = Array.from({ length: weeks }, (_, c) =>
    Array.from({ length: 7 }, (_, r) => {
      const time = first + (c * 7 + r) * DAY
      if (time > today) return null
      const date = iso(time)
      return { date, time, value: values.get(date) ?? 0 }
    }),
  )
  return { first, columns }
}

/** The weekday a week starts on in a locale (0 = Sunday), where the browser can tell; else Monday. */
export function weekStartOf(locale: string) {
  try {
    const info = new Intl.Locale(locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } }
    const first = (info.getWeekInfo?.() ?? info.weekInfo)?.firstDay
    return first === undefined ? 1 : first % 7
  } catch {
    return 1
  }
}
