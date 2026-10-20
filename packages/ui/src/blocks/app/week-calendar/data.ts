import { dateTimeFormat } from '../../../lib/utils'
/* The calendar page's week: Monday 28 September to Friday 2 October 2026,
 * with "now" fixed at 10:42 on the Monday so the page renders the same on
 * the server and in the browser. Recurring events also fill the weeks
 * either side. Pass your calendar API's through the page's `events` and
 * `calendars`, and your clock as `now`. */

export type CalendarTone = 'primary' | 'success' | 'warning' | 'danger'

/** A calendar events belong to, drawn in its tone. */
export interface CalendarSource {
  id: string
  name: string
  tone: CalendarTone
}

export interface CalendarEvent {
  id: string
  title: string
  /** The day, as "2026-09-29". */
  date: string
  /** Minutes after midnight. */
  start: number
  end: number
  /** One of the calendars' `id`s. */
  calendar: string
  location?: string
  people?: string[]
  /** Repeats every week on its weekday. */
  recurring?: boolean
}

/* Blocks are tinted with an opaque mix over the card, so the hour lines
 * behind them never show through the text. */
export const TONES: Record<CalendarTone, { block: string; dot: string }> = {
  primary: {
    block:
      'border-[color-mix(in_oklab,var(--color-accent)_45%,var(--color-surface))] bg-[color-mix(in_oklab,var(--color-accent)_10%,var(--color-surface))] hover:bg-[color-mix(in_oklab,var(--color-accent)_16%,var(--color-surface))]',
    dot: 'bg-accent',
  },
  success: {
    block:
      'border-[color-mix(in_oklab,var(--color-success)_45%,var(--color-surface))] bg-[color-mix(in_oklab,var(--color-success)_10%,var(--color-surface))] hover:bg-[color-mix(in_oklab,var(--color-success)_16%,var(--color-surface))]',
    dot: 'bg-success',
  },
  warning: {
    block:
      'border-[color-mix(in_oklab,var(--color-warning)_45%,var(--color-surface))] bg-[color-mix(in_oklab,var(--color-warning)_12%,var(--color-surface))] hover:bg-[color-mix(in_oklab,var(--color-warning)_18%,var(--color-surface))]',
    dot: 'bg-warning',
  },
  danger: {
    block:
      'border-[color-mix(in_oklab,var(--color-danger)_45%,var(--color-surface))] bg-[color-mix(in_oklab,var(--color-danger)_10%,var(--color-surface))] hover:bg-[color-mix(in_oklab,var(--color-danger)_16%,var(--color-surface))]',
    dot: 'bg-danger',
  },
}

export const CALENDARS: CalendarSource[] = [
  { id: 'team', name: 'Team', tone: 'primary' },
  { id: 'focus', name: 'Focus', tone: 'success' },
  { id: 'external', name: 'External', tone: 'warning' },
]

const at = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h! * 60 + m!
}

const DATES = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02']

const event = (id: string, day: number, from: string, to: string, title: string, calendar: string, rest: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id,
  date: DATES[day]!,
  start: at(from),
  end: at(to),
  title,
  calendar,
  ...rest,
})

export const EVENTS: CalendarEvent[] = [
  event('planning', 0, '9:30', '10:15', 'Weekly planning', 'team', { location: 'Kepler room', people: ['Mira Chen', 'Jonas Weber', 'Priya Natarajan'], recurring: true }),
  event('onboarding', 0, '11:00', '12:00', 'Design review: onboarding', 'team', { location: 'Video call', people: ['Theo Martins', 'Mira Chen'] }),
  event('launch-focus', 0, '14:00', '16:00', 'Focus: launch plan', 'focus'),
  event('design-review', 1, '10:00', '11:00', 'Design review', 'team', { location: 'Kepler room', people: ['Theo Martins', 'Aiko Tanaka'] }),
  event('borealis-sync', 1, '10:30', '11:30', 'Borealis sync', 'team', { location: 'Video call', people: ['Jonas Weber', 'Sam Okafor'] }),
  event('interview', 1, '15:00', '15:45', 'Interview: frontend engineer', 'external', { location: 'Video call', people: ['Lena Fischer'] }),
  event('go-no-go', 2, '11:00', '12:00', 'Atlas 2.0 go / no-go', 'team', { location: 'Kepler room', people: ['Priya Natarajan', 'Mira Chen', 'Jonas Weber'] }),
  event('focus-wed', 2, '13:30', '16:30', 'Focus time', 'focus', { recurring: true }),
  event('acme', 3, '10:00', '10:45', 'Acme: SSO scoping', 'external', { location: 'Video call', people: ['Aiko Tanaka'] }),
  event('lunch-learn', 3, '12:30', '13:30', 'Lunch & learn: Cirrus', 'team', { location: 'Kitchen', people: ['Lena Fischer', 'Sam Okafor'] }),
  event('rehearsal', 3, '16:00', '17:00', 'Launch rehearsal', 'team', { location: 'Kepler room', people: ['Priya Natarajan', 'Mira Chen'] }),
  event('one-on-one', 4, '9:30', '10:00', '1:1 with Mira', 'team', { location: 'Video call', people: ['Mira Chen'], recurring: true }),
  event('retro', 4, '15:00', '16:00', 'Retro', 'team', { location: 'Kepler room', people: ['Mira Chen', 'Jonas Weber', 'Priya Natarajan', 'Sam Okafor'], recurring: true }),
]

/** Now: 10:42 on Monday 28 September 2026, read in local time so server and browser agree. */
export const NOW = new Date(2026, 8, 28, 10, 42)

export const DEFAULT_COPY = {
  previous: 'Previous week',
  next: 'Next week',
  viewLabel: 'View',
  week: 'Week',
  agenda: 'Agenda',
  calendars: 'Calendars',
  /** Under the title: the dates and the week's number. */
  range: (dates: string, week: number) => `${dates} · Week ${week}`,
  eventLabel: (title: string, day: string, start: string, end: string, calendar: string) => `${title}, ${day}, ${start} to ${end}, ${calendar}`,
  calendar: 'Calendar',
  where: 'Where',
  with: 'With',
  repeats: 'Repeats',
  every: (weekday: string) => `Every ${weekday}`,
  asideLabel: 'Planning',
  upNext: 'Up next today',
  /** Up next, when today has nothing left. */
  dayDone: 'Nothing else today.',
  /** How long until an event starts: "in 18 min", "in 2 h 30 min". */
  startsIn: (minutes: number) => (minutes < 60 ? `in ${minutes} min` : `in ${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${minutes % 60} min` : ''}`),
  /** An event under way. */
  now: 'Now',
  findTime: 'Find a time',
  findTimeHint: 'Hours with a calendar still free.',
  errorTitle: 'The calendar couldn’t load',
  retry: 'Try again',
}

export type CalendarCopy = typeof DEFAULT_COPY

/** A day of the week shown. */
export interface Day {
  index: number
  /** "2026-09-29" */
  iso: string
  weekday: string
  date: number
  month: string
  year: number
  /** "Tuesday 29 September" */
  name: string
}

const DAY_MS = 86_400_000
const pad = (n: number) => String(n).padStart(2, '0')
/** A local Date's day, as "2026-09-29". */
export const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
/** Midnight UTC of an ISO day, for whole-day arithmetic. */
const utc = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)))
/** 0 is Monday. */
export const weekdayOf = (iso: string) => (new Date(utc(iso)).getUTCDay() + 6) % 7

/** The five weekdays of the week holding `iso`, `offset` weeks on. */
export function weekDays(iso: string, offset: number, locale: string): Day[] {
  const monday = utc(iso) - weekdayOf(iso) * DAY_MS + offset * 7 * DAY_MS
  const weekday = dateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' })
  const month = dateTimeFormat(locale, { month: 'long', timeZone: 'UTC' })
  return [0, 1, 2, 3, 4].map((index) => {
    const d = new Date(monday + index * DAY_MS)
    const day = { weekday: weekday.format(d), month: month.format(d), date: d.getUTCDate() }
    return { index, iso: d.toISOString().slice(0, 10), year: d.getUTCFullYear(), ...day, name: `${day.weekday} ${day.date} ${day.month}` }
  })
}

/** The ISO week number of the week holding `iso`. */
export function weekNumber(iso: string) {
  const thursday = utc(iso) + (3 - weekdayOf(iso)) * DAY_MS
  const jan1 = Date.UTC(new Date(thursday).getUTCFullYear(), 0, 1)
  return Math.floor((thursday - jan1) / DAY_MS / 7) + 1
}

/** "28 Sep – 2 Oct 2026", or "5 – 9 Oct 2026" within a month. */
export function rangeLabel(days: Day[]) {
  const first = days[0]!
  const last = days[days.length - 1]!
  const start = first.month === last.month ? `${first.date}` : `${first.date} ${first.month.slice(0, 3)}`
  return `${start} – ${last.date} ${last.month.slice(0, 3)} ${last.year}`
}

/** The events on each day of the week shown: a recurring one on its weekday, any other on its date. */
export function eventsOn(days: Day[], events: CalendarEvent[]) {
  return events.flatMap((event) => {
    const day = event.recurring ? days.find((d) => d.index === weekdayOf(event.date)) : days.find((d) => d.iso === event.date)
    return day ? [{ ...event, day: day.index }] : []
  })
}

/** An event placed on the week shown: `day` is its column, 0 is Monday. */
export type PlacedEvent = CalendarEvent & { day: number }

export const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
