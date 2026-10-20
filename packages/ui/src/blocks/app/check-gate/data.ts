/* Fixtures and types for the check-gate card: a candidate's groups of checks
 * and the candidates before it, as a mobile release's demo. Pass yours
 * through the block's props. */

export interface CheckGateGroup {
  id: string
  /** The team or area that owns it, set in mono beside its name. */
  owner: string
  /** How many checks it runs. */
  total: number
  /** How many of them passed. */
  passed: number
  /** Change in pass rate since the candidate before, in points; null when it didn't move. */
  delta: number | null
}

export interface CheckGateCandidate {
  /** What names it: "4127". */
  id: string
  /** Pass rate, 0–100. */
  rate: number
}

export type CheckGateFilter = 'all' | 'blocking'

/** Pass rate of a set of groups, 0–100, weighted by their checks. */
export function passRate(groups: CheckGateGroup[]) {
  const total = groups.reduce((sum, g) => sum + g.total, 0)
  return total ? (100 * groups.reduce((sum, g) => sum + g.passed, 0)) / total : 0
}

export const GROUPS: CheckGateGroup[] = [
  { id: 'unit', owner: 'core', total: 1240, passed: 1236, delta: 0.2 },
  { id: 'snapshot', owner: 'design', total: 318, passed: 309, delta: -0.6 },
  { id: 'checkout-e2e', owner: 'payments', total: 86, passed: 77, delta: 3.9 },
  { id: 'accessibility', owner: 'design', total: 164, passed: 158, delta: 1.1 },
  { id: 'startup-budget', owner: 'performance', total: 24, passed: 21, delta: -4.2 },
  { id: 'offline-sync', owner: 'data', total: 96, passed: 96, delta: null },
]

/** The eleven candidates before this one, oldest first. */
export const HISTORY: CheckGateCandidate[] = [96.1, 97.4, 96.6, 97.9, 98.2, 96.8, 97.6, 98, 97.1, 96.4, 97.3].map((rate, i) => ({ id: String(4116 + i), rate }))
export const CANDIDATE = '4127'

/** The history with the candidate on the end, its rate taken from its groups. */
export const candidatesFor = (groups: CheckGateGroup[]): CheckGateCandidate[] => [...HISTORY, { id: CANDIDATE, rate: passRate(groups) }]

/** The pass rate a candidate has to reach to go through, 0–100. */
export const THRESHOLD = 97

export const DEFAULT_COPY = {
  title: 'Release checks',
  subject: 'Harbor iOS 5.2 · build 4127',
  ran: 'ran 14:06 on 6 devices',
  clear: 'Nothing blocking',
  blockingCount: (count: number) => `${count} ${count === 1 ? 'suite' : 'suites'} blocking`,
  passRate: 'Pass rate',
  /** The candidate against the one before it, with the change formatted ("+1.1"). */
  delta: (points: string, previous: string) => `${points} pt on ${previous}`,
  checks: (passed: string, total: string) => `${passed} of ${total} tests passed`,
  history: (count: number) => `Last ${count} builds`,
  bar: (percent: string) => `bar ${percent}`,
  chartLabel: (count: number, under: number, bar: string, candidate: string) =>
    `Pass rate of the last ${count} builds against the ${bar} bar: ${under} fell under it. The candidate is at ${candidate}.`,
  candidate: 'candidate',
  groups: 'Suites',
  filter: 'Show suites',
  all: 'All',
  blocking: 'Blocking',
  noneBlocking: 'Nothing blocking: every suite cleared the bar.',
  /** Spoken after a group's change, since the list has no column headers. */
  since: (previous: string) => `since ${previous}`,
  unchanged: 'unchanged',
  failed: (count: number) => `${count} failed`,
  review: (count: number) => (count ? `Review ${count} ${count === 1 ? 'blocker' : 'blockers'}` : 'No blockers'),
  promote: 'Ship to TestFlight',
  promoting: 'Uploading',
  promoted: 'On TestFlight',
}

export type CheckGateCopy = typeof DEFAULT_COPY & {
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
