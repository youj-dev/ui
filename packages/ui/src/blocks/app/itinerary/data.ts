import { BuildingIcon, CoffeeIcon, PlaneIcon, TicketIcon } from '@youj/icons'
import { dateTimeFormat } from '../../../lib/utils'

/** A time as it reads on the clocks at a place `offset` minutes from UTC. */
const local = (month: number, day: number, hh: number, mm: number, offset: number) => Date.UTC(2026, month - 1, day, hh, mm) - offset * 60_000

const LIS = 60
const CET = 120

export type ItineraryTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

export interface ItineraryStop {
  id: string
  /** The airport, station or site code, in mono: "LIS". */
  code: string
  /** "Lisbon". */
  name: string
  /** Local time's offset from UTC, in minutes: 60 for Lisbon in summer. */
  utcOffset: number
  /** The city's dot on the day strip. Default: the chart colors in turn. */
  tone?: ItineraryTone
}

/** A way between two stops: a flight, a train, a company move. */
export interface ItineraryLeg {
  id: string
  /** The stop it leaves from, by id. */
  from: string
  /** The stop it lands at, by id. */
  to: string
  depart: Date | number
  arrive: Date | number
  /** "TP 1036", under `copy.legCode`. */
  code?: string
  /** "14A", under `copy.legPlace`. */
  place?: string
  /** The booking reference, in mono with a copy button, under `copy.legReference`. */
  reference?: string
}

/** Where you sleep, over a span of nights. */
export interface ItineraryStay {
  id: string
  /** The stop it's in, by id. */
  at: string
  start: Date | number
  end: Date | number
  /** "Casa Bonay". */
  name: string
}

/** A sort of booking, with the icon on its day: Flight, Stay, Ticket, Table. */
export interface ItineraryBookingKind {
  id: string
  label: string
  icon: typeof PlaneIcon
}

/** Where a booking stands. A tone gives it a badge; a done one is muted and shows a check in place of its kind's icon. */
export interface ItineraryBookingStatus {
  id: string
  label: string
  tone?: 'accent' | 'success' | 'warning' | 'danger'
  /** Muted, with a check in place of the icon. Default false. */
  done?: boolean
}

export interface ItineraryBooking {
  id: string
  /** The day it's on, from 0. */
  day: number
  /** An `ItineraryBookingKind` id. */
  kind: string
  title: string
  /** A second line: "LIS 09:40 → BCN 12:55 · seat 14A". */
  detail: string
  /** Local time, as it reads there: "09:40". */
  time: string
  /** Confirmation code or reference, in mono. */
  code: string
  /** An `ItineraryBookingStatus` id. */
  status: string
}

export const STOPS: ItineraryStop[] = [
  { id: 'lis', code: 'LIS', name: 'Lisbon', utcOffset: LIS, tone: 'chart-4' },
  { id: 'bcn', code: 'BCN', name: 'Barcelona', utcOffset: CET, tone: 'chart-2' },
  { id: 'fco', code: 'FCO', name: 'Rome', utcOffset: CET, tone: 'chart-3' },
]

export const LEGS: ItineraryLeg[] = [
  { id: 'out', from: 'lis', to: 'bcn', depart: local(9, 30, 9, 40, LIS), arrive: local(9, 30, 12, 55, CET), code: 'TP 1036', place: '14A', reference: 'Q7K2LM' },
  { id: 'hop', from: 'bcn', to: 'fco', depart: local(10, 3, 14, 20, CET), arrive: local(10, 3, 16, 10, CET), code: 'VY 6104', place: '7C', reference: 'M4XRT2' },
  { id: 'home', from: 'fco', to: 'lis', depart: local(10, 5, 16, 20, CET), arrive: local(10, 5, 18, 25, LIS), code: 'TP 839', place: '22F', reference: 'Z3N8PD' },
]

export const STAYS: ItineraryStay[] = [
  { id: 'bonay', at: 'bcn', start: local(9, 30, 15, 0, CET), end: local(10, 3, 11, 0, CET), name: 'Casa Bonay' },
  { id: 'vilon', at: 'fco', start: local(10, 3, 17, 0, CET), end: local(10, 5, 11, 0, CET), name: 'Hotel Vilòn' },
]

/** The first day's midnight in Lisbon, and the days shown. */
export const START = local(9, 30, 0, 0, LIS)
export const DAYS = 6
/** Day 2, mid-afternoon in Barcelona. */
export const NOW = local(10, 1, 14, 30, CET)

export const BOOKINGS: ItineraryBooking[] = [
  { id: 'b1', day: 0, kind: 'flight', title: 'TP 1036 to Barcelona', detail: 'LIS 09:40 → BCN 12:55 · seat 14A', time: '09:40', code: 'Q7K2LM', status: 'done' },
  { id: 'b2', day: 0, kind: 'stay', title: 'Check in at Casa Bonay', detail: 'Gran Via 700 · 3 nights', time: '15:00', code: '8821 3094', status: 'done' },
  { id: 'b3', day: 0, kind: 'table', title: 'Dinner at Bar Cañete', detail: 'Table for 2', time: '21:00', code: 'BC-4471', status: 'done' },
  { id: 'b4', day: 1, kind: 'ticket', title: 'Sagrada Família', detail: 'Towers, Nativity side', time: '10:30', code: 'SF-229104', status: 'done' },
  { id: 'b5', day: 1, kind: 'table', title: 'Tapas at El Xampanyet', detail: 'Bar seats for 2', time: '20:30', code: 'XP-0931', status: 'confirmed' },
  { id: 'b6', day: 2, kind: 'ticket', title: 'Montjuïc cable car', detail: 'Return, 2 adults', time: '12:00', code: 'TM-5520', status: 'confirmed' },
  { id: 'b7', day: 3, kind: 'stay', title: 'Check out of Casa Bonay', detail: 'Late check-out asked', time: '11:00', code: '8821 3094', status: 'confirmed' },
  { id: 'b8', day: 3, kind: 'flight', title: 'VY 6104 to Rome', detail: 'BCN 14:20 → FCO 16:10 · seat 7C', time: '14:20', code: 'M4XRT2', status: 'opens' },
  { id: 'b9', day: 3, kind: 'stay', title: 'Check in at Hotel Vilòn', detail: 'Via dell’Arancio 69 · 2 nights', time: '17:00', code: 'VL-77310', status: 'confirmed' },
  { id: 'b10', day: 4, kind: 'ticket', title: 'Vatican Museums', detail: 'Early entry, 2 adults', time: '08:00', code: 'VM-88120', status: 'confirmed' },
  { id: 'b11', day: 5, kind: 'flight', title: 'TP 839 home to Lisbon', detail: 'FCO 16:20 → LIS 18:25 · seat 22F', time: '16:20', code: 'Z3N8PD', status: 'opens' },
]

export const KINDS: ItineraryBookingKind[] = [
  { id: 'flight', label: 'Flight', icon: PlaneIcon },
  { id: 'stay', label: 'Stay', icon: BuildingIcon },
  { id: 'ticket', label: 'Ticket', icon: TicketIcon },
  { id: 'table', label: 'Table', icon: CoffeeIcon },
]

export const STATUSES: ItineraryBookingStatus[] = [
  { id: 'checked-in', label: 'Checked in', tone: 'success' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'opens', label: 'Check-in opens soon', tone: 'warning' },
  { id: 'done', label: 'Done', done: true },
]

export const DEFAULT_COPY = {
  title: 'Barcelona & Rome',
  /** "30 Sep – 5 Oct · 6 days". */
  subtitle: (dates: string, days: number) => `${dates} · ${days} days`,
  more: 'More options',
  next: 'Up next',
  underway: 'In the air',
  departsIn: 'Departs in',
  arrivesIn: 'Lands in',
  finished: 'You’re home. Welcome back.',
  legCode: 'Flight',
  legPlace: 'Seat',
  legReference: 'Booking',
  /** Spoken for the route line: "Barcelona to Rome". */
  route: (from: string, to: string) => `${from} to ${to}`,
  days: 'Days',
  today: 'Today',
  plans: (day: number) => `Day ${day}`,
  /** A travel day on the strip: where it ends up, after a plane. */
  travelTo: (place: string) => `Travel to ${place}`,
  tonight: (stay: string, night: number, nights: number) => `${stay} · night ${night} of ${nights}`,
  nothing: 'Nothing booked. A free day.',
  copyCode: (code: string) => `Copy ${code}`,
  copied: (code: string) => `${code} copied`,
  share: 'Share trip',
  addPlan: 'Add plan',
  footer: 'All times are local',
  loadingLabel: 'Loading the trip',
  retry: 'Retry',
  emptyTitle: 'Nothing planned yet',
  emptyDescription: 'Legs, stays and bookings show up here.',
}

export type ItineraryCopy = typeof DEFAULT_COPY & {
  /** How its dates, times and numbers read (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

const formats = new Map<string, Intl.DateTimeFormat>()
/** A time as it reads on the clocks `offset` minutes from UTC: shift into it, then read it in UTC. */
export function localFormat(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}|${JSON.stringify(options)}`
  let format = formats.get(key)
  if (!format) {
    format = dateTimeFormat(locale, { ...options, timeZone: 'UTC' })
    formats.set(key, format)
  }
  const f = format
  return {
    format: (t: number, offset: number) => f.format(t + offset * 60_000),
    // Node's ICU pads the dash with thin spaces, a browser's doesn't: hydration needs one text.
    range: (a: number, b: number, offset: number) => f.formatRange(a + offset * 60_000, b + offset * 60_000).replace(/[  ]/g, ' '),
  }
}

