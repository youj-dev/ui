import type { SeatMapRow, SeatMapTier } from '../../../components/ui/seat-map'

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

export const TIERS: SeatMapTier[] = [
  { id: 'front', name: 'Front stalls', price: 68 },
  { id: 'stalls', name: 'Stalls', price: 48 },
  { id: 'rear', name: 'Rear stalls', price: 32 },
]

const LETTERS = 'ABCDEFGHIJ'
const PER_ROW = 14
/** Aisles after seats 3 and 11: 3 · 8 · 3. */
export const AISLES = [3, 11]

/** Taken seats, as "row:seat", so the demo house looks sold in patches. */
const TAKEN = new Set([
  'A:4', 'A:5', 'A:6', 'A:7', 'A:8', 'A:9', 'B:5', 'B:6', 'B:7', 'B:8', 'B:12', 'B:13', 'C:1', 'C:2', 'C:6', 'C:7', 'C:8', 'C:9', 'C:10',
  'D:4', 'D:5', 'D:9', 'D:10', 'D:11', 'E:6', 'E:7', 'E:12', 'E:13', 'E:14', 'F:4', 'F:5', 'F:11', 'G:1', 'G:2', 'G:3', 'G:8', 'G:9',
  'H:5', 'H:6', 'H:7', 'I:10', 'I:11', 'J:1', 'J:2', 'J:13', 'J:14',
])

export const ROWS: SeatMapRow[] = LETTERS.split('').map((letter, r) => ({
  id: letter,
  label: letter,
  seats: Array.from({ length: PER_ROW }, (_, i) => ({
    id: `${letter}${i + 1}`,
    number: i + 1,
    tier: r < 3 ? 'front' : r < 7 ? 'stalls' : 'rear',
    unavailable: TAKEN.has(`${letter}:${i + 1}`),
  })),
}))

export const PICKED = ['F7', 'F8']
export const MAX_SEATS = 8
/** Booking fee per seat. */
export const FEE = 2.5
/** How long picked seats are held, and how much of it is left when the demo opens (seconds). */
export const HOLD = 600
export const HOLD_LEFT = 552

/** The demo's copy, for a concert. */
export const DEFAULT_COPY = {
  currency: 'EUR',
  title: 'Nightjar',
  subtitle: 'Live at the Roundhouse · Fri 14 Nov, 20:00',
  more: 'Event options',
  map: 'Seats',
  footnote: 'Prices include VAT',
  selection: 'Your seats',
  count: (n: number, max: number) => `${n} of ${max}`,
  pickPrompt: 'Pick seats on the map. They’re held for you while you check out.',
  remove: (seat: string) => `Remove ${seat}`,
  seat: (row: string, n: number) => `Row ${row} · Seat ${n}`,
  subtotal: 'Tickets',
  fees: 'Booking fees',
  total: 'Total',
  held: 'Held for',
  holdHint: 'Seats go back on sale when the timer ends.',
  expired: 'Your hold ran out and the seats went back on sale.',
  holdAgain: 'Hold again',
  confirm: 'Checkout',
  clear: 'Clear',
  cleared: 'Seats cleared',
  loadingLabel: 'Loading the seats',
  retry: 'Retry',
  emptyTitle: 'No seats to pick',
  emptyDescription: 'The seat plan shows up here.',
}

export type SeatPlanCopy = typeof DEFAULT_COPY & {
  /** How its prices and counts read (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
