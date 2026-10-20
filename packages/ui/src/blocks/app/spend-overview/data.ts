/* Fixtures for the spend overview: a month's spend so far against a limit,
 * the latest requests, the audit trail and the numbers behind the three cards.
 * Swap them for your billing and logging APIs; every shape is a plain record. */

/** One request to your API: newest first in `requests`. */
export interface SpendRequest {
  id: string
  /** The HTTP status; 400 and up is a failure. */
  status: number
  /** What was called: a model or a route. */
  name: string
  /** Who called it. */
  caller: string
  /** What it cost, to size its bar in the strip. */
  cost: number
  /** ISO time. */
  at: string
}

/** A change someone made to the workspace. */
export interface SpendAuditEvent {
  id: string
  title: string
  actor: string
  /** ISO time. */
  at: string
}

/** The signed-in member's own spend. */
export interface SpendPersonal {
  spend: number
  /** The same stretch of the last period, for the change. */
  previous: number
  /** Their spend on each elapsed day, oldest first. */
  daily: number[]
  requests: number
  tokens: number
  /** Their monthly limit. */
  limit: number
}

export interface SpendMember {
  id: string
  name: string
  spend: number
}

export interface SpendBilling {
  /** Credit left to spend. */
  credit: number
  /** When the period turns over: an ISO date. */
  resetsAt: string
}

/** The period: October 2026, 31 days, 13 of them gone. */
export const START = '2026-10-01'
export const PERIOD_DAYS = 31
export const NOW = '2026-10-13T12:00:00Z'
export const LIMIT = 12000
/** What the same 13 days cost last period. */
export const PREVIOUS = 5254.88

/** Spend on each elapsed day. */
export const DAILY = [463.59, 504.07, 489.29, 324.06, 310.34, 512.09, 527.1, 498.75, 560.19, 578.78, 605.05, 562.29, 580.57]

const NAMES = ['Pine Large', 'Pine Mini', 'Alder 3', 'Fern Vision']
const CALLERS = ['Dax', 'Kit', 'Mara Okafor', 'Joon Park', 'Tilda Reyes']
const FAILED: Record<number, number> = { 2: 429, 9: 500, 17: 429, 31: 503 }

const at = (minutesAgo: number) => new Date(Date.parse(NOW) - minutesAgo * 60_000).toISOString().replace('.000', '')

/** The latest forty requests, newest first, four of them failed. */
export const REQUESTS: SpendRequest[] = Array.from({ length: 40 }, (_, i) => ({
  id: `req_${i + 1}`,
  status: FAILED[i] ?? 200,
  name: NAMES[(i * 3 + 1) % NAMES.length] as string,
  caller: CALLERS[(i * 2 + 1) % CALLERS.length] as string,
  cost: [4.2, 9.8, 2.6, 14.1, 6.3, 3.4, 11.7, 5.1][(i * 5) % 8] as number,
  at: at(i * 3 + 1 + (i % 4)),
}))

export const AUDIT: SpendAuditEvent[] = [
  { id: 'a1', title: 'Updated model policy', actor: 'Mara Okafor', at: '2026-10-13T11:26:00Z' },
  { id: 'a2', title: 'Raised Dax’s budget', actor: 'Joon Park', at: '2026-10-13T09:02:00Z' },
  { id: 'a3', title: 'Created ci-evals', actor: 'Mara Okafor', at: '2026-10-13T08:11:00Z' },
  { id: 'a4', title: 'Created Design spend', actor: 'Tilda Reyes', at: '2026-10-13T04:03:00Z' },
]

export const PERSONAL: SpendPersonal = {
  spend: 249.87,
  previous: 271.6,
  daily: [11.36, 17.04, 19.88, 8.52, 5.68, 20.82, 22.72, 17.98, 21.77, 24.61, 27.45, 22.72, 29.32],
  requests: 13180,
  tokens: 214_200_000,
  limit: 1000,
}

export const MEMBERS: SpendMember[] = [
  { id: 'mara', name: 'Mara Okafor', spend: 1976.51 },
  { id: 'joon', name: 'Joon Park', spend: 1193 },
  { id: 'tilda', name: 'Tilda Reyes', spend: 955.63 },
]

export const AVERAGE_SPEND = 197.45

export const BILLING: SpendBilling = { credit: 3483.83, resetsAt: '2026-11-01' }

export const DEFAULT_COPY = {
  title: 'Spend overview',
  subtitle: 'Workspace · October 2026',
  workspaceSpend: 'Workspace spend',
  change: (period: string) => `vs ${period}`,
  lastPeriod: 'last period',
  onTrack: 'On track',
  willExceed: (date: string) => `Will exceed limit by ${date}`,
  overLimit: (date: string) => `Over limit since ${date}`,
  projected: (amount: string, date: string) => `Projected ${amount} by ${date}`,
  legendSpent: 'Spent',
  legendForecast: 'Forecast',
  legendLimit: 'Limit',
  chart: 'Spend this month against the limit',
  open: (name: string) => `Open ${name}`,
  requests: 'Requests',
  requestsLatest: (count: number) => `Last ${count} requests`,
  failed: (count: number) => `${count} failed`,
  requestStrip: (count: number, failed: number) => `${count} requests, ${failed} failed. The tall bars cost the most; failed ones are red.`,
  failedRequest: 'Failed',
  audit: 'Audit',
  auditCount: (count: number) => `${count} changes this week`,
  by: (name: string) => `by ${name}`,
  personal: 'Your usage',
  personalSub: 'This month',
  requestsLabel: 'Requests',
  tokensLabel: 'Tokens',
  personalLimit: (amount: string) => `of ${amount} / mo`,
  personalBars: 'Your spend by day',
  leaderboard: 'Top spenders',
  leaderboardSub: 'Who’s spending the most',
  average: 'Average per member',
  billing: 'Billing',
  billingSub: 'Invoiced monthly',
  credit: 'Available credit',
  resets: (date: string) => `Resets at midnight UTC · ${date}`,
  workspaceLimit: 'Workspace limit',
  limitOf: (amount: string) => `of ${amount} / mo`,
  limitLeft: (amount: string) => `${amount} left`,
  loading: 'Loading spend',
  error: 'Couldn’t load your spend.',
  retry: 'Try again',
  emptyRequests: 'No requests yet',
  emptyAudit: 'No changes this week',
  emptyMembers: 'No spend yet',
}

export type SpendOverviewCopy = typeof DEFAULT_COPY
