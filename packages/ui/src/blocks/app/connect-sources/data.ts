/* A fictional team's sources, three of six plugged in: pass yours through the block's props. */

export type SourceStatus = 'connected' | 'backfilling' | 'available'
export type SourceTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

export interface DataSource {
  id: string
  label: string
  /** Its color in the key, the plug and the coverage meter. */
  tone: SourceTone
  status: SourceStatus
  /** Events a day once it is in: shown under a connected source. */
  perDay?: number
  /** The coverage it adds, 0–1: the meter counts the connected ones, an available one offers it. */
  coverage: number
  /** Its volume through a day, oldest hour first (24 values, any scale): the small histogram. For an available source, what it would bring. */
  volume: readonly number[]
  /** Backfilling: how far, 0–1. */
  progress?: number
  /** Backfilling: how many days of history it is pulling in. */
  backfillDays?: number
}

/** A day's shape: quiet at night, a swell through working hours, its peak at `peak` (0–23). */
const day = (peak: number, height: number, width = 4) =>
  Array.from({ length: 24 }, (_, h) => Math.round((0.06 + height * Math.exp(-((h - peak) ** 2) / (2 * width * width))) * 100) / 100)

export const SOURCES: DataSource[] = [
  { id: 'identity', label: 'Identity', tone: 'chart-3', status: 'connected', perDay: 4100, coverage: 0.17, volume: day(10, 1) },
  { id: 'devices', label: 'Devices', tone: 'chart-1', status: 'connected', perDay: 3800, coverage: 0.14, volume: day(13, 0.8, 5) },
  { id: 'cloud', label: 'Cloud', tone: 'chart-5', status: 'backfilling', coverage: 0.1, volume: day(16, 0.9, 3), progress: 0.64, backfillDays: 7 },
  { id: 'mail', label: 'Mail', tone: 'chart-4', status: 'available', coverage: 0.08, volume: day(11, 0.7, 2.5) },
  { id: 'network', label: 'Network', tone: 'chart-2', status: 'available', coverage: 0.06, volume: day(3, 0.9, 2) },
  { id: 'apps', label: 'Apps', tone: 'neutral', status: 'available', coverage: 0.05, volume: day(14, 0.6, 3) },
]

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

const plural = (n: number, one: string, other: string) => (new Intl.PluralRules('en').select(n) === 'one' ? one : other)

export const DEFAULT_COPY = {
  title: 'Data sources',
  subtitle: 'Connect your stack',
  connectedCount: (connected: number, total: number) => `${connected} of ${total} connected`,
  sourcesLabel: 'Sources',
  connected: 'Connected',
  perDay: (events: string) => `${events} / day`,
  backfilling: (days: number) => `Backfilling ${days} ${plural(days, 'day', 'days')}`,
  adds: (percent: string) => `+${percent} coverage`,
  connect: (source: string) => `Connect ${source}`,
  connecting: (source: string) => `Connecting ${source}`,
  announceConnected: (source: string) => `${source} connected`,
  failed: (source: string) => `${source} didn’t connect. Try again.`,
  coverage: 'Coverage',
  skip: 'Skip for now',
  continue: 'Continue',
}

export type ConnectSourcesCopy = typeof DEFAULT_COPY
