import type { RotaLane, RotaShift } from '../../../components/ui/time-lanes'

/** Someone on the rota: a lane in the chart colors. */
export type ShiftRotaPerson = RotaLane
/** A stretch of the week one person holds, or an override covering part of another's. */
export type ShiftRotaShift = RotaShift

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

const HOUR = 3_600_000
/** The week shown: Monday 28 September 2026, local midnight. */
export const WEEK = new Date(2026, 8, 28).getTime()
/** Where the demo's clock starts: Wednesday, 14:32:08. */
export const NOW = WEEK + 2 * 24 * HOUR + 14.5 * HOUR + 128_000
const at = (day: number, hour: number) => WEEK + (day * 24 + hour) * HOUR

export const PEOPLE: ShiftRotaPerson[] = [
  { id: 'mara', name: 'Mara Quinn', detail: 'Platform' },
  { id: 'theo', name: 'Theo Park', detail: 'Platform' },
  { id: 'iris', name: 'Iris Okafor', detail: 'Data infra' },
  { id: 'jonas', name: 'Jonas Weber', detail: 'Platform' },
]

/** The primary rotation hands off at 09:00; two overrides cover part of someone's shift. */
export const SHIFTS: ShiftRotaShift[] = [
  { id: 's0', lane: 'jonas', start: at(-1, 9), end: at(0, 9) },
  { id: 's1', lane: 'mara', start: at(0, 9), end: at(1, 9) },
  { id: 's2', lane: 'theo', start: at(1, 9), end: at(2, 9) },
  { id: 's3', lane: 'iris', start: at(2, 9), end: at(3, 9) },
  { id: 's4', lane: 'jonas', start: at(3, 9), end: at(4, 9) },
  { id: 's5', lane: 'mara', start: at(4, 9), end: at(7, 9) },
  { id: 'o1', lane: 'theo', start: at(3, 12), end: at(3, 18), override: true },
  { id: 'o2', lane: 'iris', start: at(5, 10), end: at(5, 16), override: true },
]

export const DEFAULT_COPY = {
  title: 'On call',
  subtitle: 'Platform · week 40',
  more: 'More options',
  current: 'On call now',
  onDuty: 'On call',
  override: 'Override',
  timeLeft: 'Time left',
  ends: (time: string) => `ends ${time}`,
  next: 'Next',
  /** The button that reaches whoever is on shift now. */
  contact: 'Page',
  contacting: 'Paging…',
  contacted: 'Paged',
  swap: 'Swap',
  swapWith: 'Hand the rest of this shift to',
  swapped: (name: string, time: string) => `${name} is on call until ${time}`,
  covering: (name: string) => `Covering ${name}`,
  rota: 'This week',
  legendNow: 'Now',
  legendHandoff: 'Handoff',
  legendOverride: 'Override',
  status: 'Escalates after 5 min',
  schedule: 'Full schedule',
}

export type ShiftRotaCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
