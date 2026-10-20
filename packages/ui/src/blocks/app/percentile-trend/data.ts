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

/** One window of the range control. */
export interface PercentileTrendRange {
  id: string
  /** On the control: "1H". */
  label: string
  /** In the spoken change: "last hour". Default: `label`. */
  name?: string
}

export const RANGES: PercentileTrendRange[] = [
  { id: '1h', label: '1H', name: 'last hour' },
  { id: '24h', label: '24H', name: 'last 24 hours' },
  { id: '7d', label: '7D', name: 'last 7 days' },
]

export interface PercentileTrendItem {
  id: string
  /** A small mono tag before the name: a method, a zone code. */
  prefix?: string
  /** What the row is: a route, a zone, a level. */
  name: string
  /** Its high percentile (the headline's), in the figures' unit. */
  value: number
  /** Share of the item's samples over the target, 0–1. */
  over: number
}

export interface PercentileTrendSnapshot {
  /** The sampled values, in the figures' unit (milliseconds by default). */
  samples: number[]
  /** The p99 of the period before, for the change. */
  previous: number
  /** How many there were in the window. */
  count: number
  items: PercentileTrendItem[]
  /** When the snapshot was taken, as shown. */
  updated: string
}

/** The target: a value should come in at 300 or under (milliseconds by default). */
export const TARGET = 300

/** A seeded generator (mulberry32), so the demo draws the same requests on every visit. */
function seeded(seed: number) {
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/** Latencies around `median` ms, log-normal, with a share of slow requests (a cold cache, a retry) further out. */
function latencies(count: number, median: number, spread: number, slowShare: number, seed: number) {
  const random = seeded(seed)
  const normal = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random())
  return Array.from({ length: count }, () => {
    const slow = random() < slowShare
    const ms = Math.exp(Math.log(slow ? median * 4.5 : median) + normal() * (slow ? spread * 1.3 : spread))
    return Math.round(ms * 10) / 10
  })
}

const route = (id: string, prefix: string, name: string, value: number, over: number): PercentileTrendItem => ({ id, prefix, name, value, over })

/** The same number of samples in every window, so switching morphs one swarm into the next. */
const SAMPLED = 360

export const SNAPSHOTS: Record<string, PercentileTrendSnapshot> = {
  '1h': {
    samples: latencies(SAMPLED, 72, 0.36, 0.025, 3),
    previous: 301,
    count: 48_210,
    updated: '14:32',
    items: [
      route('checkout', 'POST', '/checkout', 322, 0.018),
      route('intent', 'POST', '/payments/intent', 391, 0.027),
      route('cart', 'GET', '/cart', 168, 0.004),
      route('order', 'GET', '/orders/:id', 131, 0.001),
    ],
  },
  '24h': {
    samples: latencies(SAMPLED, 84, 0.42, 0.04, 7),
    previous: 398,
    count: 1_184_000,
    updated: '14:32',
    items: [
      route('checkout', 'POST', '/checkout', 468, 0.041),
      route('intent', 'POST', '/payments/intent', 552, 0.058),
      route('cart', 'GET', '/cart', 214, 0.009),
      route('order', 'GET', '/orders/:id', 176, 0.004),
    ],
  },
  '7d': {
    samples: latencies(SAMPLED, 93, 0.46, 0.055, 13),
    previous: 549,
    count: 8_020_000,
    updated: '14:30',
    items: [
      route('checkout', 'POST', '/checkout', 642, 0.052),
      route('intent', 'POST', '/payments/intent', 771, 0.071),
      route('cart', 'GET', '/cart', 263, 0.012),
      route('order', 'GET', '/orders/:id', 204, 0.006),
    ],
  },
}

export const DEFAULT_COPY = {
  title: 'Latency',
  subtitle: 'checkout-api · us-east-1',
  more: 'More actions',
  copyLink: 'Copy link',
  exportSamples: 'Export samples',
  range: 'Time range',
  headline: 'p99 latency',
  /** The change from the period before: "+38 ms vs prev." */
  change: (delta: string) => `${delta} vs prev.`,
  slower: 'Slower than the period before',
  faster: 'Faster than the period before',
  stats: 'Percentiles',
  p50: 'p50',
  p90: 'p90',
  count: 'Requests',
  strip: 'Sampled requests',
  items: 'Routes',
  itemColumns: 'Over SLO · p99',
  overShare: (share: string) => `${share} over`,
  status: { ok: 'within the objective', slow: 'over the objective' },
  /** Spoken after the range changes. */
  announcement: (range: string, p99: string, within: string) => `${range}: p99 ${p99}, ${within} within the objective.`,
  /** The footer's status line. */
  sampled: (shown: string, total: string) => `Sampled ${shown} of ${total} requests`,
  updated: (time: string) => `Updated ${time}`,
  openTraces: 'Open traces',
  setAlert: 'Set alert',
  settingAlert: 'Setting alert…',
  alertSet: 'Alert set',
  loading: 'Loading the latency',
  retry: 'Retry',
  emptyTitle: 'No samples yet',
  emptyDescription: 'Sampled requests show up here.',
}

export type PercentileTrendCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale every figure is written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
