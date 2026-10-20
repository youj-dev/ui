import type { DayScheduleCopy } from './data'

/* A small cron reader for the five standard fields (minute hour day month
 * weekday): numbers, `*`, lists, ranges and steps. It answers two questions
 * for the card: when does this run today, and how do you say it. */

const DAY = 1440

interface CronFields {
  minutes: number[]
  hours: number[]
  /** Weekdays it runs on, Sunday 0; null for every day. */
  weekdays: number[] | null
  raw: string[]
}

function values(source: string, min: number, max: number): number[] | null {
  const out = new Set<number>()
  for (const part of source.split(',')) {
    const [range = '', stepText] = part.split('/')
    const step = stepText === undefined ? 1 : Number(stepText)
    if (!Number.isInteger(step) || step < 1) return null
    let from = min
    let to = max
    if (range !== '*') {
      const [a, b] = range.split('-')
      from = Number(a)
      to = b === undefined ? (stepText === undefined ? from : max) : Number(b)
      if (!Number.isInteger(from) || !Number.isInteger(to) || from < min || to > max || from > to) return null
    }
    for (let v = from; v <= to; v += step) out.add(v)
  }
  return [...out].sort((a, b) => a - b)
}

function parseCron(expression: string): CronFields | null {
  const raw = expression.trim().split(/\s+/)
  if (raw.length !== 5) return null
  const minutes = values(raw[0]!, 0, 59)
  const hours = values(raw[1]!, 0, 23)
  const days = values(raw[4]!, 0, 7)
  if (!minutes || !hours || !days || !values(raw[2]!, 1, 31) || !values(raw[3]!, 1, 12)) return null
  return { minutes, hours, weekdays: raw[4] === '*' ? null : [...new Set(days.map((d) => d % 7))], raw }
}

/** Today's starts, in minutes after midnight, for a weekday (Sunday 0). Paused or not, the job's own schedule. */
function runsOn(expression: string, weekday: number): number[] {
  const cron = parseCron(expression)
  if (!cron || (cron.weekdays && !cron.weekdays.includes(weekday))) return []
  return cron.hours.flatMap((h) => cron.minutes.map((m) => h * 60 + m)).sort((a, b) => a - b)
}

const single = (field: string) => /^\d+$/.test(field)

/** The schedule in words, through the card's copy. */
function describeCron(expression: string, copy: DayScheduleCopy, time: (minute: number) => string, list: (items: string[]) => string): string {
  const cron = parseCron(expression)
  if (!cron) return copy.custom
  const [minute = '', hour = '', day, month, weekday] = cron.raw
  if (day !== '*' || month !== '*') return copy.custom
  const mm = String(cron.minutes[0]).padStart(2, '0')
  const weekdays = weekday === '1-5'
  if (weekday !== '*' && !weekdays) return copy.custom
  if (hour === '*' && !weekdays) {
    if (minute === '*') return copy.everyMinutes(1)
    if (/^\*\/\d+$/.test(minute)) return copy.everyMinutes(Number(minute.slice(2)))
    if (single(minute)) return copy.hourlyAt(mm)
  }
  if (/^\*\/\d+$/.test(hour) && single(minute) && !weekdays) return copy.everyHours(Number(hour.slice(2)), mm)
  if (single(hour) && single(minute)) {
    const at = time(cron.hours[0]! * 60 + cron.minutes[0]!)
    return weekdays ? copy.weekdaysAt(at) : copy.dailyAt(at)
  }
  if (/^\d+(,\d+)+$/.test(hour) && single(minute) && !weekdays) return copy.atTimes(list(cron.hours.map((h) => time(h * 60 + cron.minutes[0]!))))
  return copy.custom
}

/** The same schedule `by` minutes later, when its minute is a single number; otherwise unchanged. */
function shiftCron(expression: string, by: number): string {
  const cron = parseCron(expression)
  if (!cron || !single(cron.raw[0]!)) return expression
  const [, hour = '', ...rest] = cron.raw
  const minute = cron.minutes[0]! + by
  if (minute < 60) return [String(minute), hour, ...rest].join(' ')
  if (!/^\d+(,\d+)*$/.test(hour)) return expression
  return [String(minute - 60), cron.hours.map((h) => (h + 1) % 24).join(','), ...rest].join(' ')
}

/** Minutes from `minute` to the next start (tomorrow's first once today's are done); Infinity with none. */
function minutesUntil(runs: readonly number[], minute: number) {
  let best = Infinity
  for (const run of runs) best = Math.min(best, run > minute ? run - minute : run + DAY - minute)
  return best
}

export { describeCron, minutesUntil, parseCron, runsOn, shiftCron }
