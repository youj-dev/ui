/* A fictional log platform's price list and usage presets: pass yours through the block's props. */

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

export type EstimateBuilderTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

/** One line of the bill: a usage you set on a ruler, and what it costs. */
export interface EstimateBuilderLine {
  id: string
  /** "Ingest". */
  label: string
  tone: EstimateBuilderTone
  /** The usage's unit, after its amount: "GB / day". */
  unit: string
  min: number
  max: number
  step: number
  /** The price of one billed unit, in `copy.currency`, before the region's factor. */
  price: number
  /** The billed unit, after the price: "GB". */
  priceUnit: string
  /** Billed units a month for one unit of usage: 30 for a daily amount, 1 for a monthly one. Default 1. */
  perMonth?: number
  /** Ticks on its ruler. Default: the slider's own. */
  ticks?: number
}

/** A usage per line, by line id. */
export type EstimateBuilderUsage = Record<string, number>

export interface EstimateBuilderPreset {
  id: string
  label: string
  usage: EstimateBuilderUsage
}

export interface EstimateBuilderRegion {
  id: string
  label: string
  /** Multiplies every price: 1.08 is 8% dearer. */
  factor: number
}

export type EstimateBuilderBilling = 'monthly' | 'annual'

/** What Save estimate sends: the usage, the region, the billing and the totals. */
export interface EstimateBuilderValue {
  usage: EstimateBuilderUsage
  region: string
  billing: EstimateBuilderBilling
  monthly: number
  total: number
}

/** How the card's amounts are written. Each replaces the default whole. */
export interface EstimateBuilderFormats {
  /** The estimate, each line's cost and its share of the bar. Default: `copy.currency`, whole units. */
  amount?: Intl.NumberFormatOptions
  /** A line's unit price. Default: `copy.currency`, two decimals. */
  unitPrice?: Intl.NumberFormatOptions
}

export const LINES: EstimateBuilderLine[] = [
  { id: 'ingest', label: 'Ingest', tone: 'chart-1', unit: 'GB / day', min: 0, max: 200, step: 5, price: 0.14, priceUnit: 'GB', perMonth: 30 },
  { id: 'retention', label: 'Retention', tone: 'chart-2', unit: 'days', min: 7, max: 90, step: 1, price: 2.4, priceUnit: 'day', ticks: 42 },
  { id: 'queries', label: 'Queries', tone: 'chart-3', unit: 'TB / month', min: 0, max: 100, step: 1, price: 2.75, priceUnit: 'TB' },
  { id: 'seats', label: 'Seats', tone: 'chart-4', unit: 'seats', min: 1, max: 60, step: 1, price: 9, priceUnit: 'seat', ticks: 40 },
]

export const PRESETS: EstimateBuilderPreset[] = [
  { id: 'hobby', label: 'Hobby', usage: { ingest: 10, retention: 7, queries: 4, seats: 3 } },
  { id: 'startup', label: 'Startup', usage: { ingest: 60, retention: 30, queries: 30, seats: 12 } },
  { id: 'scale', label: 'Scale', usage: { ingest: 180, retention: 90, queries: 90, seats: 45 } },
]

export const REGIONS: EstimateBuilderRegion[] = [
  { id: 'na-east', label: 'na-east', factor: 1 },
  { id: 'eu-central', label: 'eu-central', factor: 1.08 },
  { id: 'ap-south', label: 'ap-south', factor: 1.12 },
]

export const DEFAULT_COPY = {
  title: 'Cost estimate',
  region: 'Region',
  estimated: 'Estimated cost',
  billing: 'Billing',
  monthly: 'Monthly',
  annual: 'Annual',
  /** The annual discount beside its segment, already formatted: "−15%". */
  discount: (percent: string) => `−${percent}`,
  perMonth: '/ month',
  perYear: '/ year',
  /** The all-in price of the first line's unit: "≈ $0.29 per GB ingested, all-in". */
  allIn: (price: string, unit: string) => `≈ ${price} per ${unit} ingested, all-in`,
  breakdown: 'Cost by line',
  usage: 'Usage',
  presets: 'Usage preset',
  preset: (name: string) => `${name} preset`,
  custom: 'Custom',
  /** A line's unit price under its cost: "$0.14 / GB". */
  unitPrice: (price: string, unit: string) => `${price} / ${unit}`,
  caption: (currency: string, region: string) => `${currency} · Excl. tax · ${region}`,
  reset: 'Reset',
  save: 'Save estimate',
  saving: 'Saving…',
  saved: 'Saved',
  failed: 'Couldn’t save',
  announce: (total: string, period: string) => `${total} ${period}`,
  currency: 'USD',
  loadingLabel: 'Loading the estimate',
  retry: 'Retry',
  emptyTitle: 'Nothing to estimate',
  emptyDescription: 'Add a line and its price shows up here.',
}

export type EstimateBuilderCopy = typeof DEFAULT_COPY
