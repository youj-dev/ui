import type { UsageInvoiceStatus, UsageRange } from './data'

/** Every string the usage page shows, to rewrite or translate. */
export const DEFAULT_COPY = {
  title: 'Usage & billing',
  subtitle: 'This billing cycle · updated hourly',
  workspace: 'Halcyon Studio',
  plan: 'Scale plan',
  // The summary strip
  cycle: 'This cycle',
  monthToDate: 'Month-to-date spend',
  ofBudget: 'of',
  budget: 'budget',
  budgetUsed: 'Budget used',
  projected: 'Projected bill',
  overBudget: (amount: string) => `${amount} over budget at this pace`,
  withinBudget: 'Within budget at this pace',
  billingCycle: 'Billing cycle',
  resets: 'Until the cycle resets',
  daysLeft: 'days left',
  // Daily cost
  dailyCost: 'Daily cost',
  over: (days: number) => `over ${days} days`,
  range: 'Range',
  ranges: { '7d': '7 d', '30d': '30 d', cycle: 'Cycle' } as Record<UsageRange, string>,
  chartTitle: 'Daily cost by resource',
  chartSummary: 'Compute is the largest share every day; weekends cost about a third less.',
  day: 'Day',
  chartCaption: 'Daily cost by resource, in USD.',
  // Meters
  included: 'Included usage',
  overage: 'Overage bills at list price',
  meterLabel: (label: string, used: string, included: string, unit: string) => `${label}: ${used} of ${included} ${unit} included`,
  alertAt: (percent: number) => `Alert at ${percent}%`,
  meterDetail: (included: string, unit: string, percent: number) => `of ${included} ${unit} included · alert at ${percent}%`,
  // Spend cap
  spendCap: 'Spend cap',
  capDescription: 'A hard limit. At the cap, usage pauses until you raise it.',
  perCycle: 'per cycle',
  headroom: 'Headroom',
  headroomAtPace: 'Headroom at this pace',
  projectedOverage: 'Projected overage',
  capWarning: (day: number) => `At this pace you reach the cap around day ${day} of the cycle. Raise it, or trim usage before then.`,
  saveCap: 'Save cap',
  savingCap: 'Saving…',
  capSaved: 'Cap saved',
  // Invoices
  invoices: 'Invoices',
  invoicesDescription: 'Charged to your payment method at the end of each cycle.',
  invoiceStatus: { due: 'Due', paid: 'Paid', refunded: 'Refunded' } as Record<UsageInvoiceStatus, string>,
  download: (period: string) => `Download ${period} invoice`,
  downloaded: 'Downloaded',
  emptyInvoices: 'No invoices yet. The first arrives at the end of this cycle.',
  // States
  loadFailed: 'Usage couldn’t load.',
  retry: 'Try again',
}

export type UsageOverviewCopy = typeof DEFAULT_COPY
