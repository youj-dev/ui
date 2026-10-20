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

/** A window the snapshots can be read over: "6H". */
export interface HealthDialRange {
  id: string
  label: string
}

export const RANGES: HealthDialRange[] = [
  { id: '15m', label: '15M' },
  { id: '6h', label: '6H' },
  { id: '3d', label: '3D' },
]
/** The window shown first when none is asked for and it is among the ranges. */
export const RANGE = '6h'

/** A state a part can be in: its tone, and whether it offers the action. */
export interface HealthDialStatus {
  id: string
  label: string
  /** The dot and the badge. `muted` also sets the part's name in the muted ink. */
  tone: 'success' | 'warning' | 'danger' | 'muted'
  /** Offers the row's action (Rebalance), as long as the part comes in with this status. */
  action?: boolean
  /** The status the part takes once the action is done. Default: it stays as it is. */
  then?: string
}

export const STATUSES: HealthDialStatus[] = [
  { id: 'nominal', label: 'nominal', tone: 'success' },
  { id: 'lagging', label: 'lagging', tone: 'warning', action: true, then: 'isolated' },
  { id: 'isolated', label: 'isolated', tone: 'muted' },
]

/** One of the part rows under the dial: a region, a turbine, a ward. */
export interface HealthDialPart {
  id: string
  /** Set in mono. */
  label: string
  /** A `HealthDialStatus` id. */
  status: string
  /** The two figures beside its name, formatted by `format.measures` (default: requests a second and the p99 latency in milliseconds). */
  measures: [number, number]
}

/** A meter beside the dial. */
export interface HealthDialSignal {
  id: string
  label: string
  value: number
  /** The meter's full scale. Default 100. */
  max?: number
  /** Cells from a threshold's value up take its tone, and its label is spoken with the value. */
  thresholds?: { value: number; tone: 'accent' | 'success' | 'warning' | 'danger' | 'neutral'; label?: string }[]
  /** Intl.NumberFormat options for the value. Default: a percentage of the scale. */
  format?: Intl.NumberFormatOptions
}

export interface HealthDialSnapshot {
  /** The dial's value, 0–100. */
  index: number
  signals: HealthDialSignal[]
  parts: HealthDialPart[]
}

const part = (id: string, label: string, rps: number, p99: number, status = 'nominal'): HealthDialPart => ({ id, label, status, measures: [rps, p99] })
const high = [{ value: 80, tone: 'warning' as const, label: 'High' }]
const signals = (saturation: number, budget: number, connections: number): HealthDialSignal[] => [
  { id: 'saturation', label: 'Saturation', value: saturation, thresholds: high },
  { id: 'budget', label: 'Error budget used', value: budget, thresholds: [{ value: 75, tone: 'warning', label: 'High' }] },
  { id: 'connections', label: 'Open connections', value: connections, max: 2000, format: {} },
]

export const SNAPSHOTS: Record<string, HealthDialSnapshot> = {
  '15m': {
    index: 86,
    signals: signals(54, 31, 740),
    parts: [part('euc1', 'eu-central-1', 2140, 142), part('use2', 'us-east-2', 1870, 610, 'lagging'), part('apse1', 'ap-southeast-1', 960, 205)],
  },
  '6h': {
    index: 74,
    signals: signals(67, 79, 1310),
    parts: [part('euc1', 'eu-central-1', 2380, 158), part('use2', 'us-east-2', 2020, 930, 'lagging'), part('apse1', 'ap-southeast-1', 1090, 231)],
  },
  '3d': {
    index: 63,
    signals: signals(71, 91, 1580),
    parts: [part('euc1', 'eu-central-1', 2210, 171), part('use2', 'us-east-2', 1940, 1270, 'lagging'), part('apse1', 'ap-southeast-1', 1030, 248)],
  },
}

export const DEFAULT_COPY = {
  title: 'Service health',
  /** The subject's name, set in mono under the title. */
  subject: 'payments-api',
  close: 'Close',
  range: 'Time range',
  index: 'Health index',
  nominal: 'Nominal',
  strained: 'Strained',
  critical: 'Critical',
  signals: 'Signals',
  parts: 'Regions',
  /** The first figure beside a part, when `format.measures` doesn't write it; gets the figure compact. */
  firstMeasure: (value: string) => `${value} req/s`,
  /** The second figure beside a part, when `format.measures` doesn't write it; gets the figure with its unit. */
  secondMeasure: (value: string) => `p99 ${value}`,
  /** `{ago}` is replaced by the time since the last check, kept in its own case. */
  checked: 'Checked {ago} ago',
  /** Shown on a button whose action failed. */
  failed: 'Failed',
  justNow: 'Checked just now',
  rebalance: 'Shift traffic',
  rebalanceFrom: (part: string) => `Shift traffic from ${part}`,
  rebalancing: 'Shifting…',
  capacity: 'Capacity',
  capacityValue: (count: number) => `${count} ${count === 1 ? 'replica' : 'replicas'}`,
  addCapacity: 'Add replica',
  adding: 'Adding…',
  loadingLabel: 'Loading health',
  retry: 'Retry',
  emptyTitle: 'No readings yet',
  emptyDescription: 'Signals and parts show up here once the first check comes in.',
}

export type HealthDialCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
