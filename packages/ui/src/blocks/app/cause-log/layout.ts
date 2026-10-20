import type { CauseLogEntry } from './data'
import { dateTimeFormat } from '../../../lib/utils'

const HOUR = 3_600_000

export interface EntryMark {
  id: string
  source: string
  /** Where it starts across the window, 0–100. */
  left: number
  /** How much of the window it covers, 0–100; an entry that began before the window is cut at its edge. */
  width: number
}

/** Every entry that overlaps the `hours` before `now`, as a position along that window. */
export function entryMarks(entries: readonly CauseLogEntry[], now: number, hours = 24): EntryMark[] {
  const start = now - hours * HOUR
  return entries.flatMap((entry) => {
    const from = Date.parse(entry.startedAt)
    const to = from + entry.duration * 60_000
    if (to <= start || from >= now) return []
    const left = (Math.max(from, start) - start) / (now - start)
    const right = (Math.min(to, now) - start) / (now - start)
    return [{ id: entry.id, source: entry.source, left: left * 100, width: (right - left) * 100 }]
  })
}

/** The sources with entries in the window, the longest first, at most `limit`. */
export function busiestSources(marks: readonly EntryMark[], limit = 4): string[] {
  const total = new Map<string, number>()
  for (const mark of marks) total.set(mark.source, (total.get(mark.source) ?? 0) + mark.width)
  return [...total]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([source]) => source)
}

/** How far a time zone's clock is ahead of UTC at `at`, in minutes (an IANA name; none is UTC). */
export function zoneOffset(at: number, timeZone?: string): number {
  if (!timeZone || timeZone === 'UTC') return 0
  // lint-blocks-allow: reads the zone's wall clock to find its offset
  const parts = dateTimeFormat('en', { timeZone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).formatToParts(at)
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  const wall = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'))
  return Math.round((wall - Math.floor(at / 60_000) * 60_000) / 60_000)
}

/** The labelled ticks along the window: every `step` hours of the zone's clock (`offset` minutes ahead of UTC), as a moment and a position along it. */
export function windowTicks(now: number, hours = 24, step = 6, offset = 0): { at: number; position: number }[] {
  const start = now - hours * HOUR
  const size = step * HOUR
  const shift = offset * 60_000
  const ticks: { at: number; position: number }[] = []
  for (let at = Math.ceil((start + shift) / size) * size - shift; at < now; at += size) {
    if (at > start) ticks.push({ at, position: ((at - start) / (now - start)) * 100 })
  }
  return ticks
}
