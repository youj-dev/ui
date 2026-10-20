import type { WeekDialEntry, WeekDialKind } from './model'

export type { WeekDialEntry, WeekDialKind, WeekDialTone } from './model'

/** Every string the card shows or speaks. */
export const DEFAULT_COPY = {
  title: 'Hours by weekday',
  chart: 'Time entries by weekday, round a dial',
  /** The big figure's name, for screen readers. */
  total: 'Total',
  /** What the readout says for an entry, and what a screen reader hears for each: the day, the times, the kind and its length. */
  reading: (day: string, range: string, kind: string, duration: string) => `${day} ${range} · ${kind} · ${duration}`,
  /** The label on the now hand. */
  now: (time: string) => `Now ${time}`,
  empty: 'No time logged this week',
  summary: (total: string, entries: number) => `${total} logged in ${entries} entries this week. Use the arrow keys to read each entry.`,
}

export type WeekDialCopy = typeof DEFAULT_COPY & { locale: string }

/** What the card is drawn from when it is given nothing. */
export const KINDS: WeekDialKind[] = [
  { id: 'billable', label: 'Billable', tone: 'accent' },
  { id: 'personal', label: 'Personal', tone: 'neutral' },
]

/** The Monday of the demo's week. */
export const WEEK_START = '2026-10-05'

const at = (day: number, kind: string, start: string, end: string): WeekDialEntry => ({ day: `2026-10-0${day}`, kind, start, end })

export const ENTRIES: WeekDialEntry[] = [
  at(5, 'personal', '09:00', '09:45'),
  at(5, 'billable', '10:00', '12:30'),
  at(5, 'billable', '14:00', '17:45'),
  at(6, 'billable', '09:30', '12:15'),
  at(6, 'billable', '14:00', '15:15'),
  at(6, 'personal', '15:30', '17:30'),
  at(7, 'billable', '09:00', '12:30'),
  at(7, 'billable', '13:45', '17:45'),
  at(8, 'personal', '09:15', '10:00'),
  at(8, 'billable', '10:15', '12:15'),
  at(8, 'billable', '13:30', '16:15'),
  at(9, 'personal', '09:00', '10:00'),
  at(9, 'billable', '10:15', '11:00'),
  at(9, 'personal', '11:15', '13:00'),
]
