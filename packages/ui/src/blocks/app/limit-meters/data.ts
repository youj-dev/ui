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

/** A group the limiters are listed under: the picker shows each kind's label as a heading. */
export interface LimitMetersKind {
  id: string
  label: string
}

export const KINDS: LimitMetersKind[] = [
  { id: 'key', label: 'API keys' },
  { id: 'endpoint', label: 'Endpoints' },
]

export interface LimitMetersLimiter {
  id: string
  /** The `id` of the kind it is listed under. */
  kind: string
  /** What is limited: a service's key, a route, a line or a member, set in mono. */
  name: string
  /** A second line beside the name: a masked id, or what the limit is keyed by. */
  hint: string
  /** The sustained limit, per minute; the bucket earns back limit ÷ 60 tokens a second. */
  limit: number
  /** The bucket's size: the largest burst it lets through at once. */
  capacity: number
  /** The burst allowance: the most a client may send at once. The bucket's marker sits here; under it a full burst would be refused in part. */
  burst: number
  /** Its traffic, on average, per minute. */
  volume: number
  /** How bursty that traffic is, 0 (steady) to 1 (spiky). */
  spikiness: number
  /** What was refused in each five minutes of the last hour, oldest first. */
  refusals: number[]
  /** Tokens earned back each second. Default: the limit ÷ 60. `0` for a bucket that doesn't refill, like a data plan's. (The demo traffic always refills at the limit.) */
  refill?: number
  /** Tokens in the bucket now, from your gateway. Default: the bucket full. The demo limiters run their own traffic instead. */
  tokens?: number
}

export const LIMITERS: LimitMetersLimiter[] = [
  {
    id: 'checkout',
    kind: 'key',
    name: 'checkout-svc',
    hint: 'sk_demo_…4f2a',
    limit: 600,
    capacity: 60,
    burst: 20,
    volume: 430,
    spikiness: 0.35,
    refusals: [0, 0, 2, 0, 0, 1, 0, 0, 4, 0, 0, 1],
  },
  {
    id: 'batch-sync',
    kind: 'key',
    name: 'batch-sync',
    hint: 'sk_demo_…9c01',
    limit: 300,
    capacity: 40,
    burst: 25,
    volume: 282,
    spikiness: 0.85,
    refusals: [6, 9, 3, 14, 11, 4, 17, 8, 12, 9, 15, 10],
  },
  {
    id: 'mobile',
    kind: 'key',
    name: 'mobile-app',
    hint: 'pk_demo_…77ae',
    limit: 1200,
    capacity: 60,
    burst: 10,
    volume: 610,
    spikiness: 0.2,
    refusals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: 'charges',
    kind: 'endpoint',
    name: 'POST /v1/charges',
    hint: 'per key',
    limit: 900,
    capacity: 60,
    burst: 15,
    volume: 540,
    spikiness: 0.3,
    refusals: [1, 0, 0, 2, 0, 0, 0, 3, 0, 1, 0, 0],
  },
  {
    id: 'embeddings',
    kind: 'endpoint',
    name: 'POST /v1/embeddings',
    hint: 'per org',
    limit: 120,
    capacity: 20,
    burst: 8,
    volume: 124,
    spikiness: 0.6,
    refusals: [11, 14, 9, 18, 22, 16, 25, 19, 21, 17, 24, 20],
  },
]

/** A small seeded generator, so the demo traffic plays the same way every visit. */
export function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const DEFAULT_COPY = {
  title: 'Rate limits',
  scope: 'production',
  more: 'More actions',
  viewLogs: 'View request log',
  copyId: 'Copy limiter ID',
  refill: 'Refill the bucket',
  limiter: 'Limiter',
  throughput: 'Throughput',
  perMinute: 'req/min',
  status: { ok: 'Within limit', low: 'Near the limit', empty: 'Throttling' } as Record<'ok' | 'low' | 'empty', string>,
  tokens: 'Tokens',
  throttledCode: '429s', // youj-allow: the HTTP status code, not a duration
  throttledWindow: 'last hour',
  throttledChart: (count: string) => `${count} requests refused with 429 in the last hour, in five-minute steps`,
  limit: 'Limit',
  capacity: 'Bucket',
  accepted: 'Accepted',
  perMinuteUnit: '/min',
  tokensUnit: 'tokens',
  policy: (limit: string, burst: string) => `Token bucket · ${limit}/min · burst ${burst}`,
  sendBurst: 'Send a burst',
  raise: 'Raise limit',
  raising: 'Raising…',
  raised: (limit: string) => `Limit raised to ${limit} a minute`,
  refilled: 'Bucket refilled',
  demoData: 'Demo data',
  loading: 'Loading the limits',
  retry: 'Retry',
  emptyTitle: 'No limits yet',
  emptyDescription: 'What is limited shows up here.',
}

export type LimitMetersCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
