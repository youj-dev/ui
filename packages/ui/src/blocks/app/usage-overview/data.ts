import type { ComponentType } from 'react'
import { CpuIcon, DatabaseIcon, GlobeIcon, ZapIcon } from '@youj/icons'
import { dateTimeFormat } from '../../../lib/utils'

/* Cumulus's metering, deterministic so the page renders the same everywhere.
 * Pass your own as the page's `daily`, `meters` and `invoices`. */

/** A metered resource: one series of the daily cost chart. */
export interface UsageResource {
  /** The key its cost has in each day's `costs`. */
  key: string
  label: string
  /** A CSS colour: a chart token such as `var(--color-chart-1)`. */
  color: string
}

/** One day's cost, by resource key. */
export interface UsageDay {
  /** The day as the axis shows it: "Sep 27". */
  day: string
  costs: Record<string, number>
}

/** A metered allowance and how much of it is used. */
export interface UsageMeter {
  id: string
  label: string
  icon?: ComponentType<{ size?: number }>
  used: number
  included: number
  /** The unit after the figures: "GB", "calls". */
  unit: string
  /** The share of `included` that raises the alert, 0–1. */
  alert: number
}

export type UsageInvoiceStatus = 'due' | 'paid' | 'refunded'

export interface UsageInvoice {
  /** The invoice number. */
  id: string
  /** The period it bills: "August 2026". */
  period: string
  amount: number
  status: UsageInvoiceStatus
}

export type UsageRange = '7d' | '30d' | 'cycle'

const CYCLE_DAYS = 30
const TODAY = 27 // Sep 27 of a Sep 1 – Sep 30 cycle
const BUDGET = 2000
const CAP = 2500
// lint-blocks-allow: the demo fixture's axis labels; an app's `days` bring their own
const dayLabel = dateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

/** Forty days of daily cost, ending today; deterministic so the page renders the same everywhere. */
const DAILY: UsageDay[] = Array.from({ length: 40 }, (_, i) => {
  const date = new Date(Date.UTC(2026, 7, 19 + i))
  const weekday = date.getUTCDay()
  const load = weekday === 0 || weekday === 6 ? 0.62 : 1
  const wave = (n: number, a: number) => Math.round((Math.sin(i * n) * a + a * 1.6) * load * 100) / 100
  return {
    day: dayLabel.format(date),
    costs: {
      compute: wave(0.9, 22) + (i > 30 ? 9 : 0),
      bandwidth: wave(1.7, 11),
      storage: 6.4 + i * 0.05,
      functions: wave(2.3, 4),
    },
  }
})

/** The chart's series, bottom of the stack first. */
const RESOURCES: UsageResource[] = [
  { key: 'storage', label: 'Storage', color: 'var(--color-chart-5)' },
  { key: 'functions', label: 'Functions', color: 'var(--color-chart-4)' },
  { key: 'bandwidth', label: 'Bandwidth', color: 'var(--color-chart-2)' },
  { key: 'compute', label: 'Compute', color: 'var(--color-chart-1)' },
]

/** The days a range shows: the last 7 or 30, or the cycle so far. */
const rangeRows = (daily: UsageDay[], range: UsageRange, today: number) => daily.slice(-(range === '7d' ? 7 : range === '30d' ? 30 : today))
const spend = (rows: UsageDay[]) => rows.reduce((sum, r) => sum + Object.values(r.costs).reduce((a, b) => a + b, 0), 0)

const METERS: UsageMeter[] = [
  { id: 'compute', label: 'Compute', icon: CpuIcon, used: 1_412, included: 1_600, unit: 'GB-hrs', alert: 0.8 },
  { id: 'bandwidth', label: 'Bandwidth', icon: GlobeIcon, used: 842, included: 1_000, unit: 'GB', alert: 0.8 },
  { id: 'storage', label: 'Storage', icon: DatabaseIcon, used: 212, included: 500, unit: 'GB', alert: 0.9 },
  { id: 'functions', label: 'Invocations', icon: ZapIcon, used: 9_870_000, included: 10_000_000, unit: 'calls', alert: 0.75 },
]

const INVOICES: UsageInvoice[] = [
  { id: 'CU-2026-08', period: 'August 2026', amount: 1_906.12, status: 'due' },
  { id: 'CU-2026-07', period: 'July 2026', amount: 1_748.4, status: 'paid' },
  { id: 'CU-2026-06', period: 'June 2026', amount: 1_512.77, status: 'paid' },
  { id: 'CU-2026-05', period: 'May 2026', amount: 1_433.05, status: 'refunded' },
]
const STATUS_TONE = { due: 'warning', paid: 'success', refunded: 'secondary' } as const

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

export { BUDGET, CAP, CYCLE_DAYS, DAILY, demo, INVOICES, METERS, RESOURCES, rangeRows, spend, STATUS_TONE, TODAY }
