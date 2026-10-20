import { dateTimeFormat, numberFormat } from '../../../lib/utils'
/* Loopwork's trial-to-paid funnel for the last eight weeks, by platform.
 * Each platform has its own entry volume and step rates (and the eight weeks
 * before, for comparison); "All" is their sum. Cohorts, time to convert and
 * daily upgrades are drawn from seeded formulas, so the figures hold still
 * between renders. Pass your own `report` (a `FunnelReportData` from your
 * product-analytics API) to the block instead. */

export type Segment = 'all' | 'web' | 'ios' | 'android'
type Platform = Exclude<Segment, 'all'>

export const STEPS = [
  { id: 'pricing', short: 'Pricing', name: 'Visited pricing' },
  { id: 'trial', short: 'Trial', name: 'Started a trial' },
  { id: 'project', short: 'Project', name: 'Created a project' },
  { id: 'invite', short: 'Invite', name: 'Invited a teammate' },
  { id: 'integrate', short: 'Connect', name: 'Connected an app' },
  { id: 'paid', short: 'Paid', name: 'Upgraded to paid' },
] as const

export const SEGMENTS: Record<Segment, string> = { all: 'All', web: 'Web', ios: 'iOS', android: 'Android' }

/** A cut of the report, in the switch above it. */
export interface FunnelSegment {
  value: string
  label: string
}

export const SEGMENT_LIST: FunnelSegment[] = (Object.keys(SEGMENTS) as Segment[]).map((value) => ({ value, label: SEGMENTS[value] }))

interface PlatformModel {
  entered: number
  /** Share moving on at each step after the first. */
  rates: number[]
  previousRates: number[]
  previousEntered: number
  /** Median days from trial to paid. */
  median: number
  /** Week-8 retention the cohorts level off at. */
  plateau: number
}

const PLATFORMS: Record<Platform, PlatformModel> = {
  web: { entered: 31_400, previousEntered: 29_800, rates: [0.29, 0.71, 0.54, 0.63, 0.52], previousRates: [0.27, 0.68, 0.49, 0.64, 0.47], median: 6, plateau: 0.46 },
  ios: { entered: 10_900, previousEntered: 11_600, rates: [0.24, 0.62, 0.41, 0.48, 0.44], previousRates: [0.25, 0.55, 0.43, 0.46, 0.45], median: 9, plateau: 0.38 },
  android: { entered: 6_300, previousEntered: 5_400, rates: [0.21, 0.58, 0.37, 0.44, 0.39], previousRates: [0.2, 0.58, 0.3, 0.41, 0.38], median: 11, plateau: 0.33 },
}

const noise = (n: number, salt: number) => {
  const x = Math.sin(n * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const counts = (entered: number, rates: number[]) => rates.reduce<number[]>((list, rate) => [...list, Math.round(list[list.length - 1]! * rate)], [entered])

const sum = (lists: number[][]) => lists[0]!.map((_, i) => lists.reduce((total, list) => total + list[i]!, 0))

export interface Step {
  id: string
  /** Under its column. */
  short: string
  /** The step in full, for the tooltip, the step list and the summary. */
  name: string
  /** Who reached it this period. */
  count: number
  /** Who reached it in the period before. */
  previous: number
  /** Share of the step before that reached this one (1 for the first). */
  rate: number
  previousRate: number
}

export interface Cohort {
  /** The Monday the cohort's trials started, e.g. "Aug 3". */
  label: string
  size: number
  /** Share still active each week since signup, week 0 first; newer cohorts have fewer weeks. */
  retention: number[]
}

export interface Report {
  steps: Step[]
  /** Paid over entered. */
  conversion: number
  previousConversion: number
  cohorts: Cohort[]
  /** Days from trial to paid, one per paying team. */
  daysToPaid: number[]
  /** Upgrades a day, oldest first, ending today. */
  upgrades: FunnelUpgrade[]
}

/** A day's upgrades: an ISO date ("2026-09-29") and the count. */
export interface FunnelUpgrade {
  date: string
  value: number
}

const COHORTS = 8
export const DAYS_SHOWN = 18 * 7

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** "Today" until the browser's clock is read: the server and the first render agree on it, so a statically rendered page hydrates cleanly. */
export const FIRST_TODAY = new Date(2026, 5, 30)

export function report(segment: Segment, today: Date, locale: string): Report {
  const platforms = segment === 'all' ? (Object.keys(PLATFORMS) as Platform[]) : [segment]
  const models = platforms.map((p) => PLATFORMS[p])
  const now = sum(models.map((m) => counts(m.entered, m.rates)))
  const before = sum(models.map((m) => counts(m.previousEntered, m.previousRates)))
  const steps = STEPS.map((step, i) => ({
    ...step,
    count: now[i]!,
    previous: before[i]!,
    rate: i ? now[i]! / now[i - 1]! : 1,
    previousRate: i ? before[i]! / before[i - 1]! : 1,
  }))

  // Weekly cohorts of trials, newest last; each weighted platform decays toward its plateau.
  const trials = now[1]!
  const monday = new Date(today)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const label = dateTimeFormat(locale, { month: 'short', day: 'numeric' })
  const weight = models.map((m) => m.entered / models.reduce((t, x) => t + x.entered, 0))
  const salt = platforms.length === 1 ? platforms[0]!.length : 0
  const cohorts: Cohort[] = Array.from({ length: COHORTS }, (_, c) => {
    const start = new Date(monday)
    start.setDate(start.getDate() - (COHORTS - 1 - c) * 7)
    const weeks = COHORTS - c
    // Later cohorts keep slightly better: the onboarding checklist shipped mid-period.
    const lift = 1 + c * 0.012
    const retention = Array.from({ length: weeks }, (_, w) => {
      if (w === 0) return 1
      const r = models.reduce((t, m, i) => t + weight[i]! * (m.plateau + (1 - m.plateau) * Math.exp(-w / 1.6)), 0)
      return Math.min(1, r * lift * (0.97 + 0.06 * noise(c * 10 + w, 4 + salt)))
    })
    return { label: label.format(start), size: 0.86 + 0.28 * noise(c, 5 + salt), retention }
  })
  // The cohorts split the period's trials between them.
  const spread = cohorts.reduce((t, c) => t + c.size, 0)
  for (const c of cohorts) c.size = Math.round((trials * c.size) / spread)
  cohorts[COHORTS - 1]!.size += trials - cohorts.reduce((t, c) => t + c.size, 0)

  // Time to paid: a right-skewed spread around the median; the slowest fall past the month and off the chart.
  const median = models.reduce((t, m, i) => t + weight[i]! * m.median, 0)
  const paid = now[now.length - 1]!
  const daysToPaid = Array.from({ length: paid }, (_, i) => {
    const u = (i + 0.5) / paid
    const z = Math.log(u / (1 - u)) * 0.62 // logistic spread in log-days
    return Math.max(0.2, median * Math.exp(z + 0.25 * (noise(i, 6 + salt) - 0.5)))
  })

  // Upgrades a day: the period's paid teams spread over its days, quieter at weekends.
  const perDay = paid / 56
  const upgrades = Array.from({ length: DAYS_SHOWN }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (DAYS_SHOWN - 1 - i))
    const weekend = d.getDay() === 0 || d.getDay() === 6 ? 0.45 : 1.1
    const growth = 0.75 + (0.25 * i) / DAYS_SHOWN
    return { date: iso(d), value: Math.max(0, Math.round(perDay * weekend * growth * (0.35 + 1.3 * noise(i, 7 + salt)) - 0.4)) }
  })

  return { steps, conversion: paid / now[0]!, previousConversion: before[before.length - 1]! / before[0]!, cohorts, daysToPaid, upgrades }
}

export const pct = (locale: string, digits = 0) => numberFormat(locale, { style: 'percent', maximumFractionDigits: digits, minimumFractionDigits: digits }).format
