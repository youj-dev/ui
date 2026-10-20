import { dateTimeFormat } from '../../../lib/utils'
/* The week's time entries, as plain numbers: pure, so the blocks that draw
 * them (Week blocks and Week dial keep a copy each) only place what this
 * works out. Times are minutes after midnight on the entry's own day. */

/** The color role of a kind: the accent, a neutral gray or one of the chart colors. */
export type WeekBlocksTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

/** A kind of time: what its entries are called and the color role they are drawn in. */
export interface WeekBlocksKind {
  id: string
  label: string
  tone: WeekBlocksTone
}

/** A stretch of time on one day. */
export interface WeekBlocksEntry {
  /** The calendar day, as an ISO date: `2026-10-06`. */
  day: string
  /** When it starts, as 24-hour `HH:MM`: `09:30`. */
  start: string
  /** When it ends, after the start, the same way. */
  end: string
  /** The `id` of one of the kinds. */
  kind: string
}

/** An entry placed on the week: its column, its minutes clipped to the hours shown, and its kind. */
export interface WeekSlot {
  entry: WeekBlocksEntry
  column: number
  /** Minutes after midnight, within the window. */
  from: number
  to: number
  /** The entry's whole length in minutes, whatever the window shows of it. */
  minutes: number
  kind: WeekBlocksKind
}

/** The fill of a tone: the neutral is a quiet gray, the rest are the roles of the same name. */
export function toneFill(tone: WeekBlocksTone) {
  return tone === 'neutral' ? 'var(--color-line-strong)' : `var(--color-${tone})`
}

const DAY_MS = 86_400_000
const utc = (day: string) => Date.parse(`${day}T00:00:00Z`)
const isoOf = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** `HH:MM` as minutes after midnight (24:00 is allowed as an end); undefined when it isn't a time. */
export function parseTime(text: string): number | undefined {
  const match = /^(\d{1,2}):(\d{2})$/.exec(text)
  if (!match) return undefined
  const minutes = Number(match[1]) * 60 + Number(match[2])
  return Number(match[2]) < 60 && minutes <= 1440 ? minutes : undefined
}

/** The day `count` days after `day` (negative: before), both ISO dates. */
export function addDays(day: string, count: number) {
  return isoOf(utc(day) + count * DAY_MS)
}

/** The Monday of the week `day` falls in. */
export function mondayOf(day: string) {
  return addDays(day, -((new Date(utc(day)).getUTCDay() + 6) % 7))
}

/** Five columns, Monday to Friday, or seven when any entry falls on a weekend. */
export function weekColumns(weekStart: string, entries: readonly WeekBlocksEntry[]) {
  const first = utc(weekStart)
  return entries.some((e) => {
    const offset = Math.round((utc(e.day) - first) / DAY_MS)
    return offset === 5 || offset === 6
  })
    ? 7
    : 5
}

/** The entries that fit the week (a time that parses, an end after its start, a day in a column) and, of those, the ones that touch the window placed in it, in reading order: by day, then by start. */
export function layoutWeek(
  entries: readonly WeekBlocksEntry[],
  kinds: readonly WeekBlocksKind[],
  weekStart: string,
  columns: number,
  window: readonly [number, number],
): { slots: WeekSlot[]; valid: WeekBlocksEntry[] } {
  const first = utc(weekStart)
  const slots: WeekSlot[] = []
  const valid: WeekBlocksEntry[] = []
  for (const entry of entries) {
    const column = Math.round((utc(entry.day) - first) / DAY_MS)
    const start = parseTime(entry.start)
    const end = parseTime(entry.end)
    if (!(column >= 0 && column < columns) || start === undefined || end === undefined || end <= start) continue
    valid.push(entry)
    const from = Math.max(start, window[0] * 60)
    const to = Math.min(end, window[1] * 60)
    if (to <= from) continue
    const kind = kinds.find((k) => k.id === entry.kind) ?? { id: entry.kind, label: entry.kind, tone: 'neutral' as const }
    slots.push({ entry, column, from, to, minutes: end - start, kind })
  }
  slots.sort((a, b) => a.column - b.column || a.from - b.from || a.to - b.to)
  return { slots, valid }
}

/** Minutes per kind id, over the entries that fit the week. */
export function totalsByKind(valid: readonly WeekBlocksEntry[]) {
  const totals: Record<string, number> = {}
  for (const entry of valid) totals[entry.kind] = (totals[entry.kind] ?? 0) + (parseTime(entry.end)! - parseTime(entry.start)!)
  return totals
}

/** A length in minutes as whole hours and the minutes left. */
export function splitDuration(minutes: number) {
  const whole = Math.round(minutes)
  return { hours: Math.floor(whole / 60), minutes: whole % 60 }
}

/** The hours to label on the dial or ruler: both ends, and every third hour between (unless that crowds an end). */
export function hourTicks(fromHour: number, toHour: number) {
  const ticks = [fromHour]
  for (let h = Math.floor(fromHour / 3) * 3 + 3; h < toHour; h += 3) if (h - fromHour >= 2 && toHour - h >= 2) ticks.push(h)
  ticks.push(toHour)
  return ticks
}

/** The next selection after `key`, out of `count` entries: Right and Down step on, Left and Up step back, Home and End jump, Escape lets go; undefined for any other key. */
export function stepSelection(current: number | null, key: string, count: number): number | null | undefined {
  if (count === 0) return undefined
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return current === null ? 0 : Math.min(count - 1, current + 1)
    case 'ArrowLeft':
    case 'ArrowUp':
      return current === null ? count - 1 : Math.max(0, current - 1)
    case 'Home':
      return 0
    case 'End':
      return count - 1
    case 'Escape':
      return null
    default:
      return undefined
  }
}

/** The calendar day and the minute of it at `time` (ms) in `timeZone` (default: the browser's). */
export function wallClock(time: number, timeZone?: string) {
  // lint-blocks-allow: reads the zone's clock from Latin digits, not display
  const parts = dateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(time)
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '0'
  return { day: `${part('year')}-${part('month')}-${part('day')}`, minute: (Number(part('hour')) % 24) * 60 + Number(part('minute')) }
}
