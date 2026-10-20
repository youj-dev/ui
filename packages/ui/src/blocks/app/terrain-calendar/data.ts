import type { StatTone } from '../../../components/ui/stat-card'
import { numberFormat } from '../../../lib/utils'

/* Types, defaults and copy for the terrain calendar: every day an isometric
 * column whose height and color are that day's measure. A day holds entries,
 * each in a category with a number per measure, and a measure sums its entries
 * per day, for every category or one. The grid runs weeks along (the oldest
 * at the back, this week nearest) by days of the week, the weekend at the
 * back, so the long weekend entries stand behind the weekday ones instead of
 * hiding them. The defaults are a triathlete's six months (see demo.ts):
 * load, time and distance across run, ride and swim. Pass your own days,
 * metrics and categories. */

export type TerrainCalendarTone = StatTone

/** How one measure reads: as a figure, a line of text and a spoken phrase. */
export interface TerrainCalendarFormat {
  /** Intl.NumberFormat options for the figure. */
  options: Intl.NumberFormatOptions
  /** Words Intl has no unit for, set small after the figure: "load", "orders". */
  unit?: string
  /** One line (tooltip, legend). Default: the options, then the unit. */
  text?: (value: number, locale: string) => string
  /** As the grid speaks it. Default: the same line. */
  spoken?: (value: number, locale: string) => string
  /** A week's total, when it reads differently from a day: time as hours. */
  total?: { divideBy: number; options: Intl.NumberFormatOptions }
}

/** A measure the terrain can show: it sums `values[id]` of each day's entries. */
export interface TerrainCalendarMetric {
  id: string
  label: string
  format: TerrainCalendarFormat
  /** The terrain's color for it. Default: by position, chart-1 to chart-5. */
  tone?: TerrainCalendarTone
}

/** A kind of entry, with a filter of its own: Run, Ride… */
export interface TerrainCalendarCategory {
  id: string
  label: string
  /** A dot before its name in the day's entries. Default: none. */
  tone?: TerrainCalendarTone
  /** Offered in the filter. Default true; false for one only "All" counts. */
  filter?: boolean
}

/** One thing on a day: a session, a department's sales, a station's reading. */
export interface TerrainCalendarEntry {
  /** A `TerrainCalendarCategory` id. */
  category: string
  /** A name for an entry that has one: "Long ride", "Race". */
  title?: string
  /** The figures by `TerrainCalendarMetric` id (and by `TerrainCalendarDetail` id); a missing one counts as none. */
  values: Record<string, number>
}

export interface TerrainCalendarDay {
  /** ISO date, YYYY-MM-DD. */
  date: string
  entries: TerrainCalendarEntry[]
}

/** A column of the day's entries table, read from each entry's `values[id]`. */
export interface TerrainCalendarDetail {
  id: string
  /** The cell as shown. */
  format: (value: number, locale: string) => string
  /** The cell as it's spoken. Default: the same text. */
  spoken?: (value: number, locale: string) => string
  /** Set in the main ink rather than the muted one. */
  strong?: (value: number) => boolean
}

export const WEEK_DAYS = 7
/** The filter that counts every category. */
export const ALL = 'all'

const WHOLE: Intl.NumberFormatOptions = { maximumFractionDigits: 0 }
const unitOf = (unit: string, display: 'short' | 'long' | 'narrow', digits = 0): Intl.NumberFormatOptions => ({ style: 'unit', unit, unitDisplay: display, maximumFractionDigits: digits })
const KM = unitOf('kilometer', 'short', 1)

/** Minutes as hours and minutes: "3h 05m", "45m". */
function duration(value: number, locale: string) {
  const total = Math.round(value)
  const h = Math.floor(total / 60)
  const m = total % 60
  const minutes = numberFormat(locale, { style: 'unit', unit: 'minute', unitDisplay: 'narrow', minimumIntegerDigits: 2 })
  return h ? `${numberFormat(locale, unitOf('hour', 'narrow')).format(h)} ${minutes.format(m)}` : numberFormat(locale, unitOf('minute', 'narrow')).format(m)
}

export const METRICS: TerrainCalendarMetric[] = [
  { id: 'load', label: 'Load', tone: 'chart-1', format: { options: WHOLE, unit: 'load' } },
  {
    id: 'time',
    label: 'Time',
    tone: 'chart-4',
    format: {
      options: unitOf('minute', 'short'),
      text: duration,
      spoken: (value, locale) => numberFormat(locale, unitOf('minute', 'long')).format(value),
      total: { divideBy: 60, options: unitOf('hour', 'short', 1) },
    },
  },
  {
    id: 'distance',
    label: 'Distance',
    tone: 'chart-5',
    format: { options: unitOf('kilometer', 'short', 1), spoken: (value, locale) => numberFormat(locale, unitOf('kilometer', 'long', 1)).format(value) },
  },
]

export const CATEGORIES: TerrainCalendarCategory[] = [
  { id: 'run', label: 'Run' },
  { id: 'ride', label: 'Ride' },
  { id: 'swim', label: 'Swim' },
  { id: 'strength', label: 'Strength', filter: false },
]

export const DETAILS: TerrainCalendarDetail[] = [
  { id: 'time', format: duration },
  { id: 'distance', format: (value, locale) => numberFormat(locale, KM).format(value) },
  { id: 'effort', format: (value) => `${value}/10`, spoken: (value) => `effort ${value} of 10`, strong: (value) => value >= 8 },
]

/** The terrain's colors for measures that name none, by position. */
export const TONES: TerrainCalendarTone[] = ['chart-1', 'chart-4', 'chart-5', 'chart-2', 'chart-3']

/* ── Reading the days ───────────────────────────────────────────────────── */

/** A cell of the terrain: `row` 0 is the back (Sunday), `col` the week. */
export interface Cell {
  row: number
  col: number
}

/** Rows run Sunday (the back) to Monday (the front): a row's day of the week, 0 for Monday. */
export const weekdayOf = (row: number) => WEEK_DAYS - 1 - row
/** Whole weeks in `days` (Monday first, 7 days each). */
export const weeksIn = (days: TerrainCalendarDay[]) => Math.floor(days.length / WEEK_DAYS)
export const dayAt = (days: TerrainCalendarDay[], { row, col }: Cell) => days[col * WEEK_DAYS + weekdayOf(row)]

/** A day's entries in the category shown. */
export const entriesOf = (day: TerrainCalendarDay | undefined, category: string) => (day?.entries ?? []).filter((e) => category === ALL || e.category === category)

/** A day's measure, for every category or one. */
export function measure(day: TerrainCalendarDay | undefined, metric: string, category: string) {
  let total = 0
  for (const e of entriesOf(day, category)) total += e.values[metric] ?? 0
  return total
}

/** The terrain's readings: rows (Sunday to Monday) × weeks. */
export function gridOf(days: TerrainCalendarDay[], metric: string, category: string) {
  const weeks = weeksIn(days)
  return Array.from({ length: WEEK_DAYS }, (_, row) => Array.from({ length: weeks }, (_, col) => measure(dayAt(days, { row, col }), metric, category)))
}

/** The busiest cell: where the eye should start. */
export function peakOf(rows: number[][]): Cell {
  let best: Cell = { row: 0, col: 0 }
  let top = -Infinity
  rows.forEach((line, row) =>
    line.forEach((v, col) => {
      if (v <= top) return
      top = v
      best = { row, col }
    }),
  )
  return best
}

/** Each week's total. */
export const weekTotals = (rows: number[][]) => (rows[0] ?? []).map((_, col) => rows.reduce((sum, line) => sum + (line[col] ?? 0), 0))

/** The longest run of days with an entry: its length and the indexes of its first and last day. */
export function longestStreak(days: TerrainCalendarDay[]) {
  let best = { length: 0, from: 0, to: 0 }
  let from = 0
  days.forEach((day, i) => {
    if (!day.entries.length) from = i + 1
    else if (i - from + 1 > best.length) best = { length: i - from + 1, from, to: i }
  })
  return best
}

/** What a day with none of the category shown is: a quiet day, or a day of other categories. */
export const quietDay = (day: TerrainCalendarDay | undefined, categoryLabel: string, copy: { rest: string; noCategory: (category: string) => string }) =>
  day?.entries.length ? copy.noCategory(categoryLabel) : copy.rest

/* ── Copy ───────────────────────────────────────────────────────────────── */

export const DEFAULT_COPY = {
  /** Formats numbers and dates. Default: the YoujProvider's locale. */
  locale: undefined as string | undefined,
  title: 'Training',
  subtitle: 'Six months of workouts, day by day',
  metricLabel: 'Measure',
  categoryLabel: 'Sport',
  all: 'All',
  week: (start: string) => `Week of ${start}`,
  vsLastWeek: 'vs. the week before',
  weekly: (metric: string, weeks: number) => `${metric} by week, ${weeks} weeks`,
  streak: 'Longest streak',
  span: (from: string, to: string) => `${from} – ${to}`,
  peak: 'Peak day',
  terrain: 'Every day, week by week',
  range: (weeks: number, from: string, to: string) => `${weeks} weeks · ${from} – ${to}`,
  rest: 'Rest day',
  /** A day with entries, none of them in the category shown. */
  noCategory: (category: string) => `No ${category.toLowerCase()} sessions`,
  vsUsual: (weekday: string) => `vs. your usual ${weekday}`,
  entries: 'Sessions',
  entryCount: (n: number) => (n === 1 ? '1 session' : `${n} sessions`),
  rowLabel: (weekday: string, weeks: number) => `${weekday}s over ${weeks} weeks`,
  weekShare: (metric: string) => `of the week's ${metric.toLowerCase()}`,
  /** Names the terrain's grid for assistive tech. */
  grid: (metric: string, category: string) => `${metric} by day, ${category}`,
  day: 'Day',
  legend: 'Height and color: the day’s measure',
  selected: 'Selected',
  hints: { weeks: 'Week', days: 'Day' },
  hintsLabel: 'Keyboard',
  /** Announced when the view changes: the measure and category, then the peak day. */
  showing: (metric: string, category: string, peak: string) => `${metric}, ${category}. Peak: ${peak}.`,
  cell: (date: string, value: string) => `${date}: ${value}`,
  synced: 'Synced 5 min ago',
  loadingLabel: 'Loading the calendar',
  errorTitle: 'Couldn’t load the calendar.',
  retry: 'Retry',
  emptyTitle: 'Nothing to show yet',
  emptyDescription: 'Days appear here as they fill in.',
}

export type TerrainCalendarCopy = typeof DEFAULT_COPY
