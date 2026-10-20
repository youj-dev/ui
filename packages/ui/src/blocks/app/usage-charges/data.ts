/* Fixtures for the usage and charges screen: what a workspace metered, by day,
 * project and SKU, with the part that went past its allowance. Swap RECORDS,
 * SKUS and PROJECTS for your billing API; the shape is the common one. */

export type UsageChargesTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

/** A metered product: one row of the table and one series of the chart. */
export interface UsageChargesSku {
  id: string
  name: string
  /** Its colour in the chart and beside its name. */
  tone: UsageChargesTone
  /** What a unit is: 'GB', 'min'. Empty for plain counts, which are written short (8.6M). */
  unit: string
  /** The allowance for the period the records cover, in units. */
  included: number
  /** The price of one unit past the allowance. */
  rate: number
}

/** One day's metering of one SKU in one project. */
export interface UsageChargesRecord {
  /** The day, `YYYY-MM-DD`. */
  date: string
  /** A project's id. */
  project: string
  /** A SKU's id. */
  sku: string
  /** What was used, in the SKU's units. */
  quantity: number
  /** The part of it that is billed (past the allowance). Default 0. */
  overage?: number
}

export interface UsageChargesProject {
  id: string
  name: string
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

export const SKUS: UsageChargesSku[] = [
  { id: 'builds', name: 'Build minutes', tone: 'chart-1', unit: 'min', included: 6000, rate: 0.02 },
  { id: 'transfer', name: 'Data transfer', tone: 'chart-3', unit: 'GB', included: 500, rate: 0.35 },
  { id: 'objects', name: 'Object storage', tone: 'chart-4', unit: 'GB', included: 250, rate: 0.45 },
  { id: 'requests', name: 'Edge requests', tone: 'chart-5', unit: '', included: 10_000_000, rate: 0.000001 },
  { id: 'database', name: 'Database storage', tone: 'chart-2', unit: 'GB', included: 50, rate: 0.6 },
]

export const PROJECTS: UsageChargesProject[] = [
  { id: 'storefront', name: 'Marlow Storefront' },
  { id: 'docs', name: 'Marlow Docs' },
  { id: 'api', name: 'Marlow API' },
]

/** The thirty days to 13 October 2026. */
const DAYS = 30
const START = Date.UTC(2026, 8, 14)
const DAY_MS = 86_400_000
const SHARE: Record<string, number> = { storefront: 0.5, docs: 0.15, api: 0.35 }
/** What each SKU used over the thirty days. */
const USED: Record<string, number> = { builds: 4120, transfer: 668, objects: 391, requests: 8_600_000, database: 42 }

const iso = (day: number) => new Date(START + day * DAY_MS).toISOString().slice(0, 10)
const quiet = (day: number) => ([0, 6].includes(new Date(START + day * DAY_MS).getUTCDay()) ? 0.62 : 1)
const wave = (day: number, seed: number) => (1 + 0.34 * Math.sin(day * 1.7 + seed) + 0.18 * Math.sin(day * 0.6 + 2 * seed)) * quiet(day)

/** Spreads each SKU's total over the days and projects, and bills the part of each day past its share of the allowance. */
function build(): UsageChargesRecord[] {
  const records: UsageChargesRecord[] = []
  SKUS.forEach((sku, seed) => {
    const total = USED[sku.id] ?? 0
    const daily = Array.from({ length: DAYS }, (_, day) => wave(day, seed))
    const sum = daily.reduce((a, b) => a + b, 0)
    const quantities = daily.map((w) => (w / sum) * total)
    const raw = quantities.map((q) => Math.max(0, q - sku.included / DAYS))
    const rawSum = raw.reduce((a, b) => a + b, 0)
    const billed = Math.max(0, total - sku.included)
    const digits = sku.unit ? 2 : 0
    const round = (n: number) => Number(n.toFixed(digits))
    quantities.forEach((q, day) => {
      const overage = rawSum > 0 ? (raw[day] ?? 0) * (billed / rawSum) : 0
      for (const [project, share] of Object.entries(SHARE)) {
        records.push({ date: iso(day), project, sku: sku.id, quantity: round(q * share), overage: round(overage * share) })
      }
    })
  })
  return records
}

export const RECORDS: UsageChargesRecord[] = build()

export const DEFAULT_COPY = {
  title: 'Usage charges',
  subtitle: 'What your workspace used and what it was charged.',
  startDate: 'Start date',
  endDate: 'End date',
  projectFilter: 'Project',
  allProjects: 'All projects',
  export: 'Export CSV',
  exporting: 'Exporting…',
  exported: 'Exported',
  totalCharges: 'Total charges',
  period: (from: string, to: string) => `${from} – ${to}`,
  chartTitle: 'Charges by day',
  chartSummary: (total: string, days: number) => `${total} in charges over ${days} days, stacked by SKU.`,
  chartCaption: 'Charges by day and SKU',
  day: 'Day',
  tableTitle: 'Usage by SKU',
  sku: 'SKU',
  usage: 'Usage',
  overage: 'Over allowance',
  charge: 'Charge',
  total: 'Total',
  none: '–',
  /** Spoken for a row's usage: "668 GB of 500 GB, over the allowance". */
  usageOf: (used: string, included: string, over: boolean) => `${used} of ${included}${over ? ', over the allowance' : ''}`,
  emptyTitle: 'No usage in this range',
  emptyDescription: 'Pick another range or project to see what was metered.',
  loading: 'Loading usage',
  error: 'Couldn’t load your usage.',
  retry: 'Try again',
}

export type UsageChargesCopy = typeof DEFAULT_COPY
