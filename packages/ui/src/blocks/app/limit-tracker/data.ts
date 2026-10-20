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

export interface LimitTrackerEntry {
  id: string
  /** The category's name, set in mono. */
  name: string
  /** Used so far, in the limit's unit. */
  amount: number
}

/** A rule's text: written out, or from the formatter the card uses for amounts (`(format) => \`Over ${format(50)}\``). */
export type LimitTrackerText = string | ((format: (value: number) => string) => string)

/** One rule, a switch at the foot of the card. */
export interface LimitTrackerRule {
  id: string
  title: LimitTrackerText
  hint: LimitTrackerText
  /** On when the card opens. Default off. */
  on?: boolean
  /** Turns the rule into a line on the ruler while it is on and under the limit; the pace counts to it instead of the limit. */
  line?: { at: number; label: string }
}

export const ENTRIES: LimitTrackerEntry[] = [
  { id: 'software', name: 'software', amount: 612.4 },
  { id: 'travel', name: 'travel', amount: 438 },
  { id: 'hardware', name: 'hardware', amount: 219.9 },
  { id: 'events', name: 'events', amount: 96.5 },
]

export const RULES: LimitTrackerRule[] = [
  {
    id: 'freeze',
    title: (format) => `Freeze at ${format(1800)}`,
    hint: 'New charges stop until the card renews',
    on: true,
    line: { at: 1800, label: 'freeze' },
  },
  { id: 'receipts', title: (format) => `Receipts over ${format(50)}`, hint: 'Due within 3 days of the charge', on: true },
  { id: 'notify', title: 'Notify the approver', hint: (format) => `On every charge over ${format(200)}` },
]

export const LIMIT = 2000
/** How many entries so far. */
export const COUNT = 23
/** How much of the period has gone, in the unit the pace is read in (days). */
export const ELAPSED = 19
export const LIMITS = [1500, 2000, 3000, 5000]
/** What an approved increase adds to the limit. */
export const INCREASE = 250

export const DEFAULT_COPY = {
  currency: 'EUR',
  title: 'Team card',
  /** A short note beside the title: the card's last digits. */
  aside: 'ending 2093',
  subtitle: 'Design · renews 1 Nov',
  more: 'More card actions',
  viewHistory: 'Statements',
  viewDetails: 'Card details',
  meter: 'Card limit',
  /** The runway in the pace list, as the unit it is counted in. */
  runway: (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`,
  untilLine: 'until the freeze',
  untilLimit: 'until the limit',
  countLabel: 'charges so far',
  perUnit: 'a day on average',
  categories: 'By category',
  rules: 'Rules',
  change: 'Change limit',
  limitLabel: 'Card limit',
  increase: 'Request increase',
  requesting: 'Requesting…',
  loadingLabel: 'Loading the limit',
  retry: 'Retry',
  emptyTitle: 'Nothing used yet',
  emptyDescription: 'The ruler and categories appear with the first entry.',
}

export type LimitTrackerCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
