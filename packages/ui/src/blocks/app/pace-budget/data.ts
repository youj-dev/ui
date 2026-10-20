export interface PaceBudgetCategory {
  id: string
  /** The category's name. */
  name: string
  /** Used so far this period, in the budget's unit. */
  used: number
  /** Its colour on the map. Default: the chart colours in turn. */
  tone?: 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'
}

export interface PaceBudgetStep {
  id: string
  title: string
  detail: string
  /** What this step frees this period, in the budget's unit. */
  frees: number
  /** The category it saves from. */
  category: string
  /** On when the card opens. */
  planned?: boolean
}

export const CATEGORIES: PaceBudgetCategory[] = [
  { id: 'rent', name: 'Rent', used: 1650, tone: 'chart-1' },
  { id: 'travel', name: 'Travel', used: 540, tone: 'chart-2' },
  { id: 'groceries', name: 'Groceries', used: 486, tone: 'chart-3' },
  { id: 'dining', name: 'Dining out', used: 342, tone: 'chart-4' },
  { id: 'subscriptions', name: 'Subscriptions', used: 164, tone: 'chart-5' },
  { id: 'shopping', name: 'Shopping', used: 156, tone: 'chart-1' },
  { id: 'transport', name: 'Transport', used: 128, tone: 'chart-2' },
  { id: 'phone', name: 'Phone & internet', used: 118, tone: 'chart-3' },
]

export const STEPS: PaceBudgetStep[] = [
  {
    id: 'subscriptions',
    title: 'Cancel 3 unused subscriptions',
    detail: 'A streaming service, a fitness app and extra cloud storage, none opened in 60 days.',
    frees: 46,
    category: 'subscriptions',
    planned: true,
  },
  {
    id: 'dining',
    title: 'Cap dining out at $250',
    detail: 'A heads-up at 80%, and the card declines past the cap until the 1st.',
    frees: 92,
    category: 'dining',
    planned: true,
  },
  {
    id: 'phone',
    title: 'Switch to the 15 GB phone plan',
    detail: 'You used 9 GB a month on average since spring. Takes effect today.',
    frees: 24,
    category: 'phone',
  },
]

/** The period shown: its year, month (0–11), today's date in it and the date it ends on. */
export interface PaceBudgetPeriod {
  year: number
  month: number
  today: number
  days: number
}

/** The period's budget and what is used a day besides fixed items, at the current pace. */
export const BUDGET = 4200
export const PACE = 68
/** September, 18 days in. */
export const PERIOD: PaceBudgetPeriod = { year: 2026, month: 8, today: 18, days: 30 }

export const DEFAULT_COPY = {
  currency: 'USD',
  title: 'Spending',
  subtitle: 'September · Everyday account',
  more: 'More budget actions',
  exportCsv: 'Export transactions',
  editBudget: 'Edit budget',
  meter: 'Budget spent',
  meterValue: (used: string, budget: string, percent: string) => `${used} of ${budget}, ${percent}`,
  mapLabel: 'Spending by category',
  used: 'Spent',
  left: 'Left',
  runsOut: 'Runs out',
  lasts: 'Lasts the month',
  pace: (amount: string) => `at ${amount} a day`,
  plan: 'Savings plan',
  noneSelected: 'Nothing selected',
  nothingLeft: 'Nothing left to trim this month.',
  apply: 'Apply plan',
  applying: 'Applying',
  applied: (amount: string) => `Saved ${amount}`,
  loadingLabel: 'Loading the budget',
  retry: 'Retry',
  emptyTitle: 'Nothing here yet',
  emptyDescription: 'The map fills in as the first items arrive.',
}

export type PaceBudgetCopy = typeof DEFAULT_COPY & {
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
