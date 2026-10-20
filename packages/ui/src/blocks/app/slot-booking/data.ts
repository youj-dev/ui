import type { SlotGridSlot } from '../../../components/ui/slot-grid'

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

export interface SlotBookingService {
  id: string
  name: string
  /** How long a session runs. */
  minutes: number
  /** What it costs. Default: none, so no price is shown. */
  price?: number
  /** Places in a session. */
  capacity: number
  /** Who runs it. */
  host: { name: string; role: string; initials: string }
}

export const SERVICES: SlotBookingService[] = [
  { id: 'reformer', name: 'Reformer', minutes: 50, price: 28, capacity: 8, host: { name: 'Lena Moser', role: 'Lead instructor', initials: 'LM' } },
  { id: 'mat', name: 'Mat flow', minutes: 45, price: 18, capacity: 14, host: { name: 'Jonas Berg', role: 'Instructor', initials: 'JB' } },
  { id: 'private', name: 'Private', minutes: 55, price: 75, capacity: 1, host: { name: 'Aiko Tanaka', role: 'Physio', initials: 'AT' } },
]

/** Monday 28 September 2026, local midnight: the week the demo opens on. */
export const WEEK = new Date(2026, 8, 28).getTime()
/** Start times, in minutes after midnight. */
export const TIMES = [7 * 60, 8 * 60 + 30, 10 * 60, 12 * 60 + 30, 17 * 60 + 30, 19 * 60]
/** What a booking draws on: a pass or credit with so many places left. */
export interface SlotBookingPass {
  left: number
  total: number
}
/** The demo's class pass. */
export const PASS: SlotBookingPass = { left: 6, total: 10 }

/** A steady pseudo-random number in 0–1 for a key, so the demo's week looks the same on every render. */
function noise(key: string) {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return ((h >>> 0) % 1000) / 1000
}

/** The demo's availability for a service and a week: evenings fill first, Sunday evening and Saturday at 07:00 aren't offered. */
export function availability(service: SlotBookingService, week: number): SlotGridSlot[] {
  const slots: SlotGridSlot[] = []
  for (let d = 0; d < 7; d++) {
    const day = new Date(week)
    day.setDate(day.getDate() + d)
    for (const minute of TIMES) {
      if ((d === 6 && minute >= 17 * 60) || (d === 5 && minute === 7 * 60) || (service.id === 'private' && minute === 19 * 60)) continue
      const busy = minute >= 17 * 60 ? 0.3 : minute <= 8 * 60 + 30 ? 0.12 : 0
      const n = noise(`${service.id}:${week}:${d}:${minute}`)
      const left = Math.max(0, Math.round(service.capacity * Math.min(1, Math.max(0, 0.08 + n * 1.05 - busy))))
      const start = new Date(day)
      start.setHours(Math.floor(minute / 60), minute % 60)
      slots.push({ id: `${service.id}-${week}-${d}-${minute}`, start: start.getTime(), left, capacity: service.capacity })
    }
  }
  return slots
}

/** A slot on the timetable: a time plus the service it runs. */
export interface SlotBookingSlot extends SlotGridSlot {
  /** The service's id. */
  service: string
}

/** Thursday 1 October 2026, local midnight: the calendar's first bookable day. */
export const OPENS = new Date(2026, 9, 1).getTime()
/** How many days ahead the calendar books. */
export const DAYS = 35

/** The studio's week, Monday first: start time (minutes after midnight) and service. */
const TIMETABLE: [number, string][][] = [
  [[7 * 60, 'reformer'], [9 * 60 + 30, 'mat'], [12 * 60 + 30, 'private'], [18 * 60, 'reformer'], [19 * 60 + 30, 'mat']],
  [[7 * 60 + 30, 'mat'], [10 * 60, 'reformer'], [17 * 60 + 30, 'private'], [19 * 60, 'reformer']],
  [[7 * 60, 'reformer'], [12 * 60 + 15, 'mat'], [18 * 60, 'mat'], [19 * 60 + 30, 'reformer']],
  [[7 * 60 + 30, 'mat'], [9 * 60 + 30, 'private'], [12 * 60 + 30, 'reformer'], [18 * 60 + 30, 'reformer']],
  [[7 * 60, 'reformer'], [10 * 60, 'mat'], [17 * 60 + 30, 'mat']],
  [[9 * 60, 'reformer'], [10 * 60 + 30, 'mat'], [12 * 60, 'private']],
  [[10 * 60, 'mat'], [11 * 60 + 30, 'reformer']],
]
/** Days the studio is shut: German Unity Day, and a teacher training day. */
const CLOSED = [new Date(2026, 9, 3).getTime(), new Date(2026, 9, 19).getTime()]

/** The demo's classes on a day (local midnight): the week's timetable with places from a steady noise, evenings fuller. */
export function timetable(day: number, services: SlotBookingService[] = SERVICES): SlotBookingSlot[] {
  if (CLOSED.includes(day)) return []
  const date = new Date(day)
  const classes: SlotBookingSlot[] = []
  for (const [minute, id] of TIMETABLE[(date.getDay() + 6) % 7]!) {
    const service = services.find((s) => s.id === id)
    if (!service) continue
    const busy = minute >= 17 * 60 ? 0.35 : minute <= 7 * 60 + 30 ? 0.1 : 0
    const n = noise(`${id}:${day}:${minute}`)
    const left = Math.max(0, Math.round(service.capacity * Math.min(1, Math.max(0, 0.22 + n * 0.95 - busy))))
    const start = new Date(date)
    start.setHours(Math.floor(minute / 60), minute % 60)
    classes.push({ id: `${id}-${day}-${minute}`, service: id, start: start.getTime(), left, capacity: service.capacity })
  }
  return classes
}

export const DEFAULT_COPY = {
  currency: 'EUR',
  title: 'Book a class',
  subtitle: 'Studio Nord · Kreuzberg',
  more: 'More options',
  service: 'Class',
  previousWeek: 'Previous week',
  nextWeek: 'Next week',
  week: 'Week',
  grid: 'Times this week',
  confirm: 'Your pick',
  with: (name: string) => `with ${name}`,
  duration: 'Duration',
  price: 'Price',
  places: 'Places',
  placesLeft: (left: number) => `${left} left`,
  minutes: 'min',
  pass: 'Class pass',
  passLeft: (left: number, total: number) => `${left} of ${total} left`,
  change: 'Change',
  book: 'Book',
  booking: 'Booking…',
  booked: 'Booked',
  bookedTitle: 'You’re booked',
  bookedNote: (email: string) => `Confirmation sent to ${email}`,
  bookedAnnounce: (when: string) => `Booked for ${when}`,
  addToCalendar: 'Add to calendar',
  bookAnother: 'Book another',
  email: 'mara@example.com',
  pickPrompt: 'Pick a time to see the class, the price and who teaches it.',
  status: 'Free cancellation up to 12 h before',
  allServices: 'All classes',
  day: 'Day',
  slotsOn: (day: string) => `Classes on ${day}`,
  slotCount: (n: number) => (n === 1 ? '1 class' : `${n} classes`),
  placesOpen: (left: number) => (left === 1 ? '1 place left' : `${left} places left`),
  fewLeft: (left: number) => `Only ${left} left`,
  full: 'Full',
  yours: 'You’re in',
  closed: 'The studio is closed this day.',
  noneOfService: (name: string) => `No ${name} classes this day.`,
  nextOne: (when: string) => `Next one: ${when}`,
  openDays: 'Classes open',
  yourDays: 'Your classes',
  review: 'Review your class',
  host: 'Teacher',
  when: 'When',
  bookedLine: (what: string, when: string) => `${what}, ${when}.`,
  topUp: 'Top up pass',
  loadingLabel: 'Loading the timetable',
  errorTitle: 'Couldn’t load the timetable.',
  retry: 'Retry',
  emptyTitle: 'Nothing to book',
  emptyDescription: 'Times you can book show up here.',
}

export type SlotBookingCopy = typeof DEFAULT_COPY & {
  /** How its dates, times and numbers read (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
