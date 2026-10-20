/* A fictional team's six agents through 2026, nine months settled: pass yours through the block's props. */

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

/** One row's year: twelve months of actuals (the ones past `settled` are forecast) and its plan. */
export interface PlanVsActualRow {
  id: string
  /** Set in mono: "nightly-summarizer". */
  name: string
  /** The figure a month, January first, in `copy.currency`. */
  monthly: readonly number[]
  /** The planned figure a month. */
  plan: number
  /** Why it moved, under its name among the biggest movers: "cache hit rate up to 68%". */
  note?: string
}

/** A line of the summary list. */
export interface PlanVsActualFact {
  id: string
  label: string
  value: string
  icon?: 'bell' | 'wallet' | 'clock' | 'gauge' | 'bot'
}

export const ROWS: PlanVsActualRow[] = [
  {
    id: 'summarizer',
    name: 'nightly-summarizer',
    monthly: [420, 450, 480, 560, 640, 720, 860, 980, 1060, 1120, 1180, 1240],
    plan: 520,
    note: 'context per run tripled since May',
  },
  {
    id: 'reviewer',
    name: 'code-reviewer',
    monthly: [380, 400, 430, 470, 520, 600, 690, 760, 820, 860, 900, 940],
    plan: 450,
    note: 'reviews every draft, not just ready ones',
  },
  {
    id: 'triage',
    name: 'triage-bot',
    monthly: [520, 500, 470, 430, 380, 340, 300, 280, 270, 260, 255, 250],
    plan: 420,
    note: 'cache hit rate up to 68%',
  },
  { id: 'intake', name: 'intake-agent', monthly: [205, 210, 215, 210, 205, 215, 210, 220, 215, 215, 215, 215], plan: 220 },
  { id: 'indexer', name: 'doc-indexer', monthly: [160, 165, 160, 170, 165, 160, 170, 165, 170, 170, 170, 170], plan: 170 },
  { id: 'sampler', name: 'qa-sampler', monthly: [120, 125, 130, 120, 125, 130, 125, 120, 125, 125, 125, 125], plan: 130 },
]

/** How the card's figures are written. Each replaces the default whole. */
export interface PlanVsActualFormats {
  /** Every figure in full: a row's total, the plan, the movers. Default: `copy.currency`, whole units. */
  value?: Intl.NumberFormatOptions
  /** The ruler's ticks and the quarter bar's plan. Default: `copy.currency`, compact. */
  compact?: Intl.NumberFormatOptions
}

export const FACTS: PlanVsActualFact[] = [
  { id: 'alerts', label: 'Open alerts', value: '4', icon: 'bell' },
  { id: 'budget', label: 'Budget', value: 'AGT-26', icon: 'wallet' },
  { id: 'window', label: 'Batch window', value: '02:00 UTC', icon: 'clock' },
]

export const DEFAULT_COPY = {
  title: 'Agent spend',
  subtitle: (year: number, rows: number) => `${year} · ${rows} agents`,
  overPlan: (percent: string) => `${percent} over plan`,
  underPlan: (percent: string) => `${percent} under plan`,
  monthly: (from: string, to: string) => `Monthly spend, ${from} – ${to}`,
  actual: 'Actual',
  projected: 'Projected',
  rows: 'Agents by spend',
  others: (count: number) => `${count} other agents`,
  spendOf: (name: string) => `${name}, spend by month`,
  scale: 'Scale',
  byQuarter: 'By quarter, against plan',
  quarter: (n: number) => `Q${n}`,
  quarters: 'Spend by quarter',
  plan: 'Plan',
  spentYtd: 'Spent year to date',
  againstPlan: (plan: string) => `against a ${plan} plan`,
  projectedYear: 'Projected year',
  rowsOver: 'Agents over plan',
  rowsOverValue: (over: number, total: number) => `${over} of ${total}`,
  movers: 'Biggest movers against plan',
  insight: 'The top two agents share the 02:00 batch window',
  setPlan: 'Set budget',
  action: 'Stagger the batch',
  acting: 'Staggering…',
  acted: 'Staggered',
  failed: 'Couldn’t reschedule',
  currency: 'USD',
  loadingLabel: 'Loading the plan',
  retry: 'Retry',
  emptyTitle: 'Nothing planned yet',
  emptyDescription: 'Add a row and its months show up here.',
}

export type PlanVsActualCopy = typeof DEFAULT_COPY
