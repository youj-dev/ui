import { CarIcon, CoffeeIcon, GiftIcon, ShoppingCartIcon, TicketIcon } from '@youj/icons'
import type { Envelope } from '../../../components/ui/allocation-meter'

/** One envelope: a name, what it holds (`budget` plus any `rollover`), what is spent, an optional icon and tone. */
export type EnvelopesEnvelope = Envelope

/** One thing taken out of an envelope. */
export interface EnvelopesEntry {
  id: string
  /** What it was for, as the list names it: "Corner Market". */
  title: string
  /** The `id` of the envelope it came out of. */
  envelope: string
  amount: number
  /** An ISO date. */
  date: string
}

/** The demo's today, three days before payday. */
export const TODAY = '2026-09-28'
export const DAYS_LEFT = 3

export const ENVELOPES: EnvelopesEnvelope[] = [
  { id: 'groceries', name: 'Groceries', icon: <ShoppingCartIcon />, budget: 520, spent: 402.35, rollover: 40, tone: 'chart-1' },
  { id: 'eating', name: 'Eating out', icon: <CoffeeIcon />, budget: 220, spent: 251.6, tone: 'chart-2' },
  { id: 'fun', name: 'Fun', icon: <TicketIcon />, budget: 160, spent: 71.2, tone: 'chart-3' },
  { id: 'transport', name: 'Transport', icon: <CarIcon />, budget: 120, spent: 102.9, tone: 'chart-4' },
  { id: 'gifts', name: 'Gifts', icon: <GiftIcon />, budget: 80, spent: 12, rollover: 30, tone: 'chart-5' },
]

export const ENTRIES: EnvelopesEntry[] = [
  { id: 't1', title: 'Corner Market', envelope: 'groceries', amount: 38.42, date: '2026-09-28' },
  { id: 't2', title: 'Lisboa Café', envelope: 'eating', amount: 14.8, date: '2026-09-28' },
  { id: 't3', title: 'Metro top-up', envelope: 'transport', amount: 20, date: '2026-09-27' },
  { id: 't4', title: 'Cinema Nova', envelope: 'fun', amount: 24.5, date: '2026-09-26' },
  { id: 't5', title: 'Noodle Bar', envelope: 'eating', amount: 31.9, date: '2026-09-26' },
]

/** What Add expense logs in the demo, in turn. */
export const NEXT_ENTRIES: Omit<EnvelopesEntry, 'id' | 'date'>[] = [
  { title: 'Bakery Sol', envelope: 'groceries', amount: 6.4 },
  { title: 'Bike share', envelope: 'transport', amount: 3.5 },
  { title: 'Bookshop', envelope: 'fun', amount: 18.9 },
]

export const DEFAULT_COPY = {
  title: 'Budget',
  subtitle: (days: number) => `September · ${days} ${days === 1 ? 'day' : 'days'} to payday`,
  more: 'More options',
  safe: 'Safe to spend today',
  safeHint: (days: number) => `What's left across your envelopes, spread over ${days} ${days === 1 ? 'day' : 'days'}.`,
  onTrack: 'On track',
  tight: 'Tight',
  left: 'Left this month',
  spent: 'Spent',
  spentOf: (budget: string) => `of ${budget}`,
  envelopes: 'Envelopes',
  dragHint: (step: string) => `Drag between envelopes to move ${step}`,
  recent: 'Recent',
  today: 'Today',
  yesterday: 'Yesterday',
  payday: 'Payday Oct 1',
  cover: 'Cover overspending',
  covered: (amount: string, from: string, to: string) => `Moved ${amount} from ${from} to cover ${to}`,
  add: 'Add expense',
  adding: 'Adding…',
  added: (title: string, amount: string) => `${title}, ${amount}, added`,
  loadingLabel: 'Loading the envelopes',
  emptyTitle: 'No envelopes yet',
  emptyDescription: 'Add an envelope and what it holds shows up here.',
  retry: 'Retry',
}

export type EnvelopesCopy = typeof DEFAULT_COPY & {
  /** How its dates, times and numbers read (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/** Money as the demo writes it: US dollars. */
export const MONEY: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' }

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
