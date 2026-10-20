import type { ReactNode } from 'react'
import { BellIcon, DatabaseIcon, LayersIcon, SearchIcon, ServerIcon, ShieldIcon } from '@youj/icons'

/* A fictional company's eighteen SLOs on one afternoon: pass yours through the block's props. */

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

export type LollipopRankingAlert = 'quiet' | 'raised' | 'muted'
export type LollipopRankingTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger'

/** A band an item's value can fall in: its label, its color, and where it ends. */
export interface LollipopRankingStatus {
  id: string
  label: string
  tone: LollipopRankingTone
  /** The band holds values below this; the last band has none. Statuses go from the lowest value up. */
  below?: number
}

/** One ranked item: a row in the table and a dot on the chart. */
export interface LollipopRankingItem {
  id: string
  /** "Order intake success". */
  name: string
  /** Under the name, set in mono: "orders-api". */
  detail: string
  /** Shown before the detail. Default none. */
  icon?: ReactNode
  /** The goal, 0-1: 0.9999. */
  target: number
  /** The period it covers, in days. */
  period: number
  owner: { name: string; initials: string }
  /** What the group filter splits by: a team, a district. */
  group: string
  /** How far it stands from the line, as a share: below zero is past it. */
  value: number
  /** A `LollipopRankingStatus` id. Default: the band its value falls in. */
  status?: string
  /** Days until it crosses the line at the current pace; omit when it isn't heading there. */
  eta?: number
  /** Whether it needs attention (`raised`), was silenced (`muted`) or neither (`quiet`). */
  alert: LollipopRankingAlert
  /** The measured level over the last 90 days, oldest first. */
  history: readonly number[]
}

/** The band an item is in: its own `status`, else the first whose `below` its value is under. */
export const statusOf = (item: LollipopRankingItem, statuses: readonly LollipopRankingStatus[]): LollipopRankingStatus | undefined =>
  statuses.find((st) => st.id === item.status) ??
  statuses.find((st) => st.below === undefined || item.value < st.below) ??
  statuses[statuses.length - 1]

export const STATUSES: LollipopRankingStatus[] = [
  { id: 'exhausted', label: 'Exhausted', tone: 'danger', below: 0 },
  { id: 'risk', label: 'At risk', tone: 'warning', below: 0.25 },
  { id: 'healthy', label: 'Healthy', tone: 'success' },
]

/** The icons of the demo's kinds, as the table shows them. */
const ICON = {
  api: <ServerIcon />,
  database: <DatabaseIcon />,
  queue: <LayersIcon />,
  search: <SearchIcon />,
  notify: <BellIcon />,
  shield: <ShieldIcon />,
}

/** A level a day for 90 days, steady near the target with small noise, and a dip at each `[day, depth]`. */
function history(seed: number, target: number, dips: [number, number][]) {
  let s = seed
  const noise = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646 - 0.5
  }
  const slack = 1 - target
  return Array.from({ length: 90 }, (_, day) => {
    const dip = dips.reduce((sum, [at, depth]) => sum + depth * Math.exp(-((day - at) ** 2) / 3), 0)
    return Math.min(1, target + slack * 0.6 + slack * 0.25 * noise() - slack * dip)
  })
}

const OWNERS = {
  mara: { name: 'Mara Lind', initials: 'ML' },
  theo: { name: 'Theo Brandt', initials: 'TB' },
  ines: { name: 'Ines Okafor', initials: 'IO' },
  sam: { name: 'Sam Reyes', initials: 'SR' },
  ana: { name: 'Ana Duarte', initials: 'AD' },
  leo: { name: 'Leo Park', initials: 'LP' },
}

export const ITEMS: LollipopRankingItem[] = [
  {
    id: 'intake',
    name: 'Order intake success',
    detail: 'orders-api',
    icon: ICON.api,
    target: 0.9999,
    period: 30,
    owner: OWNERS.mara,
    group: 'Commerce',
    value: -0.823,
    alert: 'raised',
    history: history(11, 0.9999, [
      [84, 9],
      [88, 14],
    ]),
  },
  {
    id: 'push',
    name: 'Push relay availability',
    detail: 'push-relay',
    icon: ICON.notify,
    target: 0.995,
    period: 28,
    owner: OWNERS.theo,
    group: 'Platform',
    value: -0.566,
    alert: 'quiet',
    history: history(23, 0.995, [
      [80, 6],
      [86, 8],
    ]),
  },
  {
    id: 'catalog',
    name: 'Catalog search freshness',
    detail: 'search-indexer',
    icon: ICON.search,
    target: 0.99,
    period: 7,
    owner: OWNERS.ines,
    group: 'Growth',
    value: -0.368,
    alert: 'quiet',
    history: history(37, 0.99, [[87, 7]]),
  },
  {
    id: 'export',
    name: 'Nightly export on time',
    detail: 'export-jobs',
    icon: ICON.queue,
    target: 0.995,
    period: 30,
    owner: OWNERS.sam,
    group: 'Platform',
    value: -0.164,
    alert: 'muted',
    history: history(41, 0.995, [
      [70, 4],
      [85, 5],
    ]),
  },
  {
    id: 'risk',
    name: 'Risk check latency',
    detail: 'risk-scorer',
    icon: ICON.shield,
    target: 0.999,
    period: 28,
    owner: OWNERS.ana,
    group: 'Commerce',
    value: -0.088,
    alert: 'quiet',
    history: history(53, 0.999, [[83, 5]]),
  },
  {
    id: 'inventory',
    name: 'Inventory sync freshness',
    detail: 'inventory-sync',
    icon: ICON.database,
    target: 0.995,
    period: 28,
    owner: OWNERS.mara,
    group: 'Commerce',
    value: 0.079,
    eta: 12,
    alert: 'quiet',
    history: history(67, 0.995, [[86, 4]]),
  },
  {
    id: 'quotes',
    name: 'Shipping quote availability',
    detail: 'quote-api',
    icon: ICON.api,
    target: 0.999,
    period: 28,
    owner: OWNERS.leo,
    group: 'Commerce',
    value: 0.152,
    eta: 4,
    alert: 'quiet',
    history: history(71, 0.999, [[88, 4]]),
  },
  {
    id: 'cart',
    name: 'Cart API latency',
    detail: 'cart-api',
    icon: ICON.api,
    target: 0.99,
    period: 28,
    owner: OWNERS.theo,
    group: 'Commerce',
    value: 0.206,
    eta: 25,
    alert: 'quiet',
    history: history(83, 0.99, [[79, 3]]),
  },
  {
    id: 'callbacks',
    name: 'Callback delivery success',
    detail: 'callbacks',
    icon: ICON.notify,
    target: 0.999,
    period: 28,
    owner: OWNERS.leo,
    group: 'Platform',
    value: 0.363,
    eta: 30,
    alert: 'quiet',
    history: history(97, 0.999, [[76, 3]]),
  },
  {
    id: 'login',
    name: 'Login p95 latency',
    detail: 'auth-gateway',
    icon: ICON.shield,
    target: 0.99,
    period: 30,
    owner: OWNERS.ana,
    group: 'Platform',
    value: 0.418,
    eta: 41,
    alert: 'quiet',
    history: history(101, 0.99, [[52, 2]]),
  },
  {
    id: 'resize',
    name: 'Image resize success',
    detail: 'media-worker',
    icon: ICON.queue,
    target: 0.995,
    period: 28,
    owner: OWNERS.ines,
    group: 'Growth',
    value: 0.512,
    alert: 'quiet',
    history: history(113, 0.995, [[40, 2]]),
  },
  {
    id: 'invoice',
    name: 'Invoice render on time',
    detail: 'invoice-svc',
    icon: ICON.queue,
    target: 0.999,
    period: 30,
    owner: OWNERS.sam,
    group: 'Commerce',
    value: 0.577,
    alert: 'quiet',
    history: history(127, 0.999, [[33, 2]]),
  },
  {
    id: 'feed',
    name: 'Feed ranking freshness',
    detail: 'ranker',
    icon: ICON.search,
    target: 0.99,
    period: 7,
    owner: OWNERS.ines,
    group: 'Growth',
    value: 0.634,
    alert: 'quiet',
    history: history(131, 0.99, [[61, 2]]),
  },
  {
    id: 'tiles',
    name: 'Map tiles availability',
    detail: 'tile-cache',
    icon: ICON.database,
    target: 0.999,
    period: 28,
    owner: OWNERS.leo,
    group: 'Growth',
    value: 0.712,
    alert: 'quiet',
    history: history(149, 0.999, [[22, 2]]),
  },
  {
    id: 'email',
    name: 'Email relay success',
    detail: 'mail-relay',
    icon: ICON.notify,
    target: 0.995,
    period: 28,
    owner: OWNERS.theo,
    group: 'Platform',
    value: 0.751,
    alert: 'quiet',
    history: history(151, 0.995, []),
  },
  {
    id: 'session',
    name: 'Session store latency',
    detail: 'session-kv',
    icon: ICON.database,
    target: 0.999,
    period: 30,
    owner: OWNERS.sam,
    group: 'Platform',
    value: 0.823,
    alert: 'quiet',
    history: history(163, 0.999, []),
  },
  {
    id: 'status',
    name: 'Status page uptime',
    detail: 'status-page',
    icon: ICON.api,
    target: 0.9999,
    period: 30,
    owner: OWNERS.ana,
    group: 'Platform',
    value: 0.902,
    alert: 'muted',
    history: history(173, 0.9999, []),
  },
  {
    id: 'billing',
    name: 'Billing API availability',
    detail: 'billing-api',
    icon: ICON.api,
    target: 0.9995,
    period: 28,
    owner: OWNERS.mara,
    group: 'Commerce',
    value: 0.941,
    alert: 'quiet',
    history: history(181, 0.9995, []),
  },
]

/** When the figures were updated. */
export const UPDATED = '2026-09-29T14:20:00Z'

export const DEFAULT_COPY = {
  title: 'Reliability index',
  summary: (total: string, flagged: string) => `${total} SLOs · ${flagged} exhausted`,
  raised: (count: string) => `${count} paging`,
  filters: 'Filter SLOs by status',
  all: 'All',
  search: 'Search SLOs',
  searchPlaceholder: 'Search SLOs…',
  group: 'Team',
  allGroups: 'All teams',
  items: 'SLOs',
  item: 'SLO',
  owner: 'Owner',
  trend: '90 days',
  value: 'Budget left',
  eta: 'Runs out',
  alert: 'Alert',
  pastZero: 'Spent',
  steady: 'Not burning',
  alerts: { quiet: 'Quiet', raised: 'Paging', muted: 'Muted' } as Record<LollipopRankingAlert, string>,
  /** The days in a period: "30d". */
  period: (days: number) => `${days}d`,
  /** The line under an item's name: its detail, target and period. */
  meta: (detail: string, target: string, period: string) => `${detail} · ${target} · ${period}`,
  trendOf: (name: string) => `${name}, last 90 days`,
  index: 'Budget index',
  indexLabel: 'Budget left by SLO, most spent first',
  /** The picked item under the panel's title. */
  picked: (name: string, value: string, target: string, period: string) => `${name} · ${value} · ${target} over ${period}`,
  noMatch: 'No SLOs match',
  noMatchHint: 'Try another status, team or search.',
  showing: (shown: string, total: string, muted: string) => `Showing ${shown} of ${total} SLOs · ${muted} muted`,
  updated: (time: string) => `Evaluated ${time} UTC`,
  open: 'Open SLO',
  create: 'New SLO',
  loadingLabel: 'Loading the ranking',
  retry: 'Retry',
  emptyTitle: 'No SLOs yet',
  emptyDescription: 'Add one and its budget shows up here.',
}

export type LollipopRankingCopy = typeof DEFAULT_COPY
