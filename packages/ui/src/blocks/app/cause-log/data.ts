/* A fictional plant's downtime: pass yours through the block's props. */

/** The chart tones a cause can wear, or `neutral` for the catch-all. */
export type CauseTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'neutral'

export interface CauseLogCause {
  id: string
  label: string
  tone: CauseTone
}

export interface CauseLogEntry {
  id: string
  /** What it happened to, "Mill 04": the entry's row on the strip. */
  source: string
  /** When it started: an ISO date-time. */
  startedAt: string
  /** How long it lasted, in minutes: the strip draws it that long. `format` and `copy.duration` say how it reads. */
  duration: number
  /** A cause's `id`. */
  cause: string
}

export type CauseLogSort = 'newest' | 'longest'

/** The moment the demo's last 24 hours end at. */
export const DEMO_NOW = '2026-09-24T16:20:00Z'

export const CAUSES: CauseLogCause[] = [
  { id: 'tooling', label: 'Tooling', tone: 'chart-4' },
  { id: 'material', label: 'Material', tone: 'chart-5' },
  { id: 'maintenance', label: 'Maintenance', tone: 'chart-3' },
  { id: 'setup', label: 'Setup', tone: 'chart-2' },
  { id: 'quality', label: 'Quality', tone: 'chart-1' },
  { id: 'other', label: 'Other', tone: 'neutral' },
]

const stop = (id: number, source: string, startedAt: string, duration: number, cause: string): CauseLogEntry => ({ id: `s${id}`, source, startedAt, duration, cause })

export const ENTRIES: CauseLogEntry[] = [
  stop(1, 'Mill 04', '2026-09-24T14:08:00Z', 42, 'tooling'),
  stop(2, 'Mill 04', '2026-09-24T09:51:00Z', 18, 'material'),
  stop(3, 'Mill 07', '2026-09-23T22:30:00Z', 64, 'maintenance'),
  stop(4, 'Press 2', '2026-09-23T15:12:00Z', 27, 'setup'),
  stop(5, 'Weld 1', '2026-09-22T11:40:00Z', 12, 'quality'),
  stop(6, 'Press 2', '2026-09-24T03:35:00Z', 31, 'setup'),
  stop(7, 'Mill 04', '2026-09-24T15:21:00Z', 9, 'tooling'),
  stop(8, 'Weld 1', '2026-09-24T07:05:00Z', 15, 'quality'),
  stop(9, 'Mill 07', '2026-09-24T11:12:00Z', 22, 'material'),
  stop(10, 'Press 2', '2026-09-24T12:48:00Z', 36, 'maintenance'),
  stop(11, 'Weld 1', '2026-09-23T18:20:00Z', 14, 'other'),
  stop(12, 'Mill 07', '2026-09-23T06:15:00Z', 48, 'tooling'),
  stop(13, 'Press 2', '2026-09-22T20:03:00Z', 25, 'material'),
  stop(14, 'Weld 1', '2026-09-22T07:42:00Z', 19, 'setup'),
]

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export const DEFAULT_COPY = {
  title: 'Downtime log',
  subtitle: (entries: number, window: string) => `${entries} ${plural(entries, 'stop', 'stops')} · ${window}`,
  window: 'this week',
  filterLabel: 'Filter by reason',
  allReasons: 'All reasons',
  sortLabel: 'Sort stops',
  sortNewest: 'Newest first',
  sortLongest: 'Longest first',
  tableLabel: 'Stops',
  selectAll: 'Select all stops',
  selectRow: (source: string, started: string) => `Select ${source}, stopped ${started}`,
  started: 'Started',
  reason: 'Reason',
  durationHead: 'min',
  /** A duration as `format` wrote it, in a sentence. */
  duration: (duration: string) => `${duration} min`,
  empty: 'No stops match this reason.',
  lastDay: 'Last 24 hours',
  now: 'now',
  timelineLabel: (source: string, entries: number, duration: string) => `${source}: ${entries} ${plural(entries, 'stop', 'stops')}, ${duration} in the last 24 hours`,
  selected: (count: number, duration: string) => (count ? `${count} selected · ${duration}` : 'None selected'),
  assign: 'Assign cause',
  assigned: (count: number, cause: string) => `${count} ${plural(count, 'stop', 'stops')} assigned to ${cause}`,
  loadingLabel: 'Loading',
  retry: 'Retry',
}

export type CauseLogCopy = typeof DEFAULT_COPY

/** An entry longer than this is set in the warning tone, in the unit of `duration`. */
export const LONG_AFTER = 45
