export interface SplitAllocationCategory {
  id: string
  /** The category as the app names it. */
  name: string
  /** Its color on the bar. Default: the chart colors in turn. */
  tone?: 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'
}

/** What is being split: its name, the amount, and a line of detail. */
export interface SplitAllocationTotal {
  /** What it is, as the app names it: "Alder & Fern Market". */
  label: string
  /** A line under the label, before the date: where the whole amount sits until it is split. */
  detail?: string
  /** An ISO date, "2026-09-18". Default: none. */
  date?: string
  /** The whole amount in the format's major units (128 is $128.00). */
  amount: number
}

/** One line of the split, as it goes to `onSave`. */
export interface SplitLine {
  category: string
  /** In the format's major units. */
  amount: number
}

export const CATEGORIES: SplitAllocationCategory[] = [
  { id: 'groceries', name: 'Groceries', tone: 'chart-1' },
  { id: 'household', name: 'Household', tone: 'chart-2' },
  { id: 'dining', name: 'Dining', tone: 'chart-3' },
  { id: 'gifts', name: 'Gifts', tone: 'chart-4' },
  { id: 'health', name: 'Health', tone: 'chart-5' },
  { id: 'garden', name: 'Garden', tone: 'chart-1' },
  { id: 'transport', name: 'Transport', tone: 'chart-2' },
]

export const TOTAL: SplitAllocationTotal = { label: 'Alder & Fern Market', detail: 'Groceries', date: '2026-09-18', amount: 128 }

/** The demo's amounts: US dollars. */
export const MONEY: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' }

/** The categories the demo opens with. */
export const START = ['groceries', 'household', 'gifts']

export const DEFAULT_COPY = {
  title: 'Split transaction',
  mode: 'Split mode',
  equal: 'Equal split',
  custom: 'Custom split',
  allocation: 'Allocation',
  category: 'Category',
  amount: 'Amount',
  percent: 'Percent',
  amountOf: (category: string) => `${category} amount`,
  percentOf: (category: string) => `${category} percent`,
  categoryOf: (category: string) => `Category for ${category}`,
  add: 'Add category',
  remove: (category: string) => `Remove ${category}`,
  complete: (total: string) => `100% of ${total}`,
  left: (amount: string) => `${amount} left to allocate`,
  over: (amount: string) => `${amount} over`,
  cancel: 'Cancel',
  save: 'Save split',
  saving: 'Saving',
  saved: 'Split saved',
}

export type SplitAllocationCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

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
