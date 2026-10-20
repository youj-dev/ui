export type TieredCapacityTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

/** A tier of use stacked in a column: its name and color. */
export interface TieredCapacityTier {
  id: string
  label: string
  tone: TieredCapacityTone
}

export interface TieredCapacityRegion {
  /** Short code, shown in mono: "fra". */
  id: string
  name: string
  /** What is provisioned, in your unit: the region's ceiling. */
  provisioned: number
  /** What is used, by `TieredCapacityTier` id. A tier left out is none. */
  used: Record<string, number>
  /** Growth per day, in the same unit, for the headroom estimate. */
  growth: number
}

/** The key's order, top to bottom: the column stacks them from the bottom up, so the last one is its base. Default: hot on top, cold at the base. */
export const TIERS: TieredCapacityTier[] = [
  { id: 'hot', label: 'Hot', tone: 'chart-1' },
  { id: 'warm', label: 'Warm', tone: 'chart-2' },
  { id: 'cold', label: 'Cold', tone: 'chart-3' },
]

/** A region past this share of its ceiling is near its limit. */
export const NEAR_LIMIT = 0.85

export const REGIONS: TieredCapacityRegion[] = [
  { id: 'fra', name: 'Frankfurt', provisioned: 520, used: { hot: 58, warm: 140, cold: 262 }, growth: 2.1 },
  { id: 'iad', name: 'Ashburn', provisioned: 640, used: { hot: 72, warm: 190, cold: 300 }, growth: 3.4 },
  { id: 'sin', name: 'Singapore', provisioned: 380, used: { hot: 30, warm: 80, cold: 120 }, growth: 1.2 },
  { id: 'gru', name: 'São Paulo', provisioned: 260, used: { hot: 18, warm: 44, cold: 90 }, growth: 0.6 },
  { id: 'syd', name: 'Sydney', provisioned: 300, used: { hot: 22, warm: 60, cold: 100 }, growth: 0.8 },
  { id: 'nrt', name: 'Tokyo', provisioned: 500, used: { hot: 30, warm: 84, cold: 140 }, growth: 1.5 },
]

export const usedOf = (r: TieredCapacityRegion) => Object.values(r.used).reduce((sum, n) => sum + n, 0)
export const shareOf = (r: TieredCapacityRegion) => (r.provisioned > 0 ? usedOf(r) / r.provisioned : 1)
/** Whole days until the ceiling at the current growth; 0 when it's already reached. */
export const daysLeft = (r: TieredCapacityRegion) => (r.growth > 0 ? Math.max(0, Math.floor((r.provisioned - usedOf(r)) / r.growth)) : Infinity)

export const DEFAULT_COPY = {
  title: 'Capacity',
  subtitle: (regions: number) => `object storage · ${regions} regions`,
  more: 'More capacity actions',
  nearLimit: (n: number) => `${n} near limit`,
  overLimit: (n: number) => `${n} over limit`,
  allClear: 'All within limits',
  used: 'Used',
  ofProvisioned: (size: string) => `of ${size} provisioned`,
  /** Names the drawing's data table for assistive tech. */
  table: 'Storage used by region and tier',
  region: 'Region',
  regions: 'Regions',
  /** A region's button, as spoken: its code (the visible label), name and share. */
  regionButton: (code: string, name: string, percent: string) => `${code}, ${name}, ${percent} used`,
  provisioned: 'Provisioned',
  legend: 'Tiers',
  percentUsed: (percent: string) => `${percent} used`,
  fullIn: (days: number) => `Full in ~${days} ${days === 1 ? 'day' : 'days'}`,
  full: 'At its ceiling',
  over: (size: string) => `${size} over`,
  steady: 'Not growing',
  updated: 'Updated 4 min ago',
  rebalance: 'Rebalance',
  addCapacity: 'Add capacity',
  adding: 'Provisioning',
  /** The step Add capacity provisions, in your unit. */
  addStep: 100,
  added: (size: string, name: string) => `Added ${size} to ${name}`,
  loadingLabel: 'Loading capacity',
  errorTitle: 'Couldn’t load capacity.',
  retry: 'Retry',
  emptyTitle: 'No regions yet',
  emptyDescription: 'Regions show up here once they report their use.',
}

export type TieredCapacityCopy = typeof DEFAULT_COPY & {
  /** The locale every figure is written in (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
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
