/* A fictional team's chat traffic over four fictional models: pass yours through the block's props. */

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

/** One way the router can weigh a request: "Cost", "Balanced", "Quality". */
export interface RoutingFlowStrategy {
  id: string
  label: string
}

export type RoutingFlowTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

/** One route the flow can send to (a model, a processor, a plant), with what it costs and how it behaves. */
export interface RoutingFlowRoute {
  id: string
  /** "Orrery 2". */
  name: string
  /** Who serves it, set small after the name: "Tessellate", "Self-hosted". */
  detail?: string
  tone: RoutingFlowTone
  /** What one unit costs, in your own unit (the demo: dollars per 1M tokens). */
  cost: number
  /** How long it takes, in your own unit (the demo: seconds): typical, and slow (the 95th percentile). */
  time: { typical: number; slow: number }
  /** The share of units that fail, 0–1. */
  failRate: number
}

/** Each strategy's split of the flow: strategy id → route id → share (they need not sum to 1; the shares are normalized). */
export type RoutingFlowShares = Record<string, Record<string, number>>

/** Retry a failed unit on another route. */
export interface RoutingFlowFallback {
  enabled: boolean
  /** The route whose failures are retried. */
  from: string
  /** The route they are retried on. */
  to: string
}

/** A routing policy: what is live, or the draft the card edits. */
export interface RoutingFlowPolicy {
  /** The live policy's version: "v14". A deploy makes the next one. */
  version: number
  /** The id of a `RoutingFlowStrategy`. */
  strategy: string
  fallback: RoutingFlowFallback
}

/** How the card's figures are written. Each replaces the default whole (a `maximumFractionDigits` below the default minimum needs its own `minimumFractionDigits`). */
export interface RoutingFlowFormats {
  /** The blended cost and each route's cost. Default: `copy.currency`, two decimals. */
  cost?: Intl.NumberFormatOptions
  /** The slow time, in the facts and the table. Default: two decimals. */
  time?: Intl.NumberFormatOptions
  /** The failure rate. Default: a percent, two decimals. */
  rate?: Intl.NumberFormatOptions
  /** The flow's throughput. Default: whole numbers. */
  throughput?: Intl.NumberFormatOptions
}

export const STRATEGIES: RoutingFlowStrategy[] = [
  { id: 'cost', label: 'Cost' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'quality', label: 'Quality' },
]

export const ROUTES: RoutingFlowRoute[] = [
  { id: 'kestrel-pro', name: 'Kestrel 3 Pro', detail: 'Halcyon', tone: 'chart-1', cost: 11.8, time: { typical: 0.92, slow: 2.31 }, failRate: 0.0038 },
  { id: 'orrery', name: 'Orrery 2', detail: 'Tessellate', tone: 'chart-2', cost: 4.1, time: { typical: 0.48, slow: 1.27 }, failRate: 0.0024 },
  { id: 'kestrel-swift', name: 'Kestrel 3 Swift', detail: 'Halcyon', tone: 'chart-3', cost: 0.9, time: { typical: 0.21, slow: 0.58 }, failRate: 0.0057 },
  { id: 'moth', name: 'Moth 8B', detail: 'Self-hosted', tone: 'chart-4', cost: 1.6, time: { typical: 0.36, slow: 1.02 }, failRate: 0.0112 },
]

export const SHARES: RoutingFlowShares = {
  cost: { 'kestrel-pro': 0.06, orrery: 0.24, 'kestrel-swift': 0.48, moth: 0.22 },
  balanced: { 'kestrel-pro': 0.15, orrery: 0.44, 'kestrel-swift': 0.29, moth: 0.12 },
  quality: { 'kestrel-pro': 0.41, orrery: 0.43, 'kestrel-swift': 0.12, moth: 0.04 },
}

export const POLICY: RoutingFlowPolicy = {
  version: 14,
  strategy: 'balanced',
  fallback: { enabled: true, from: 'orrery', to: 'kestrel-pro' },
}

/** Requests a second through the gateway. */
export const THROUGHPUT = 312

export const DEFAULT_COPY = {
  title: 'Model router',
  pool: 'support-chat',
  live: 'Live',
  draft: 'Draft',
  blended: 'Blended cost',
  sameAsLive: 'Same as live',
  changed: 'Changed from live',
  perMillion: '/ 1M tokens',
  vsLive: 'vs. live',
  /** The headline's facts under the figure: throughput, p95 and errors, already formatted. */
  facts: (rate: string, p95: string, errors: string) => `${rate} req/s · p95 ${p95} s · ${errors} errors`,
  strategy: 'Routing strategy',
  source: 'Gateway',
  flow: 'Requests by model',
  rate: (rate: string) => `${rate}/s`,
  routes: 'Routes',
  route: 'Model',
  share: 'Share',
  time: 'p50 / p95 s',
  cost: '$ / 1M',
  failures: 'Errors',
  /** The unit after a slow time where the table folds its columns into one line. */
  timeUnit: 's',
  fallback: 'Fallback',
  fallbackIf: 'if',
  fallbackThen: 'fails, retry on',
  fallbackFrom: 'Model whose failures are retried',
  fallbackTo: 'Model to retry on',
  policy: (version: number) => `Policy v${version}`,
  unsaved: 'Unsaved changes',
  revert: 'Revert',
  deploy: 'Deploy policy',
  deploying: 'Deploying…',
  deployed: 'Deployed',
  failed: 'Couldn’t deploy',
  announceStrategy: (strategy: string, cost: string) => `${strategy}: ${cost} per 1M tokens`,
  announceDeployed: (version: number) => `Policy v${version} is live`,
  currency: 'USD',
  loadingLabel: 'Loading routes',
  retry: 'Retry',
  emptyTitle: 'No routes yet',
  emptyDescription: 'Add a route to see how the flow splits.',
}

export type RoutingFlowCopy = typeof DEFAULT_COPY
