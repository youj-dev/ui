/* A fictional household's subscriptions, every service and mark made up: pass your own events through the block's props. */

import type { ReactNode } from 'react'

export type MonthAgendaCycle = 'monthly' | 'yearly'

/** An event's mark: a simple shape in its tone, drawn by the block (pass `logo` for your own). */
export type MonthAgendaMark = 'ring' | 'half' | 'diamond' | 'kite' | 'triangle' | 'hex' | 'drop' | 'bars' | 'orbit'

export type MonthAgendaTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

/** One event. */
export interface MonthAgendaEvent {
  id: string
  name: string
  /** What it costs each time it comes round, formatted by `format`. Leave out and no money is shown for it; leave out on every event and the card shows none at all. */
  amount?: number
  cycle: MonthAgendaCycle
  /** The day it starts, "2025-10-10": it comes round on that day of each month, or of that month each year. */
  start: string
  /** Its mark, a shape the block draws. */
  mark?: MonthAgendaMark
  /** Your own logo (an `<img>` or an icon), drawn instead of `mark`. */
  logo?: ReactNode
  tone?: MonthAgendaTone
}

/** The demo's today, so the demo reads the same on the server and in every time zone. */
export const DEMO_TODAY = '2026-10-13'

export const EVENTS: MonthAgendaEvent[] = [
  { id: 'northbeam', name: 'Northbeam', amount: 10.99, cycle: 'monthly', start: '2024-03-02', mark: 'ring', tone: 'chart-5' },
  { id: 'lumen', name: 'Lumen Drive', amount: 2.99, cycle: 'monthly', start: '2025-01-04', mark: 'half', tone: 'chart-4' },
  { id: 'tessel', name: 'Tessel', amount: 54.99, cycle: 'monthly', start: '2023-06-07', mark: 'diamond', tone: 'chart-3' },
  { id: 'kite', name: 'Kite VPN', amount: 59.88, cycle: 'yearly', start: '2025-10-10', mark: 'kite', tone: 'chart-1' },
  { id: 'quill', name: 'Quill Notes', amount: 8, cycle: 'monthly', start: '2026-10-12', mark: 'triangle', tone: 'chart-2' },
  { id: 'parcel', name: 'Parcel Box', amount: 11.99, cycle: 'monthly', start: '2026-10-15', mark: 'hex', tone: 'chart-5' },
  { id: 'fernway', name: 'Fernway News', amount: 4.99, cycle: 'monthly', start: '2025-05-20', mark: 'drop', tone: 'chart-1' },
  { id: 'mono', name: 'Monotype Club', amount: 99, cycle: 'yearly', start: '2024-10-25', mark: 'bars', tone: 'chart-2' },
  { id: 'orbit', name: 'Orbit Fit', amount: 14.99, cycle: 'monthly', start: '2026-10-28', mark: 'orbit', tone: 'chart-4' },
]

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export const DEFAULT_COPY = {
  title: 'Subscriptions',
  subtitle: (count: string, added: string) => `${count} active · ${added} new`,
  add: 'Add subscription',
  adding: 'Adding',
  added: 'Added',
  today: 'Today',
  previous: 'Previous month',
  next: 'Next month',
  monthly: 'Monthly',
  yearly: 'Yearly',
  count: (n: number) => `${n} ${plural(n, 'subscription', 'subscriptions')}`,
  newCount: (n: number) => `${n} new`,
  perMonth: (amount: string) => `${amount} / mo`,
  perYear: (amount: string) => `${amount} / yr`,
  /** A day's events as spoken after its date. */
  onDay: (list: string) => `Bills ${list}`,
  /** One event as spoken: `amount` is empty when it has none. */
  onDayEvent: (name: string, amount: string, cycle: string) => (amount ? `${name}, ${amount} ${cycle}` : `${name}, ${cycle}`),
  upcoming: (name: string, date: string) => `Next: ${name}, ${date}`,
  monthTotal: (month: string) => `Due in ${month}`,
  /** The foot's label when no event has an amount. */
  monthCount: (month: string) => `In ${month}`,
  loadingLabel: 'Loading the month',
  retry: 'Retry',
  none: 'No subscriptions yet',
  failed: 'That didn’t go through',
}

export type MonthAgendaCopy = typeof DEFAULT_COPY
