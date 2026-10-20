/* A fictional line's flow rack: pass yours through the block's props. */

export type BinRackTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

export interface BinRackPart {
  id: string
  label: string
  tone: BinRackTone
}

export interface BinRackBin {
  id: string
  /** A part's `id`. */
  part: string
  /** What the bin is called, "Caps C-12". */
  label: string
  quantity: number
  capacity: number
  /** Time until it runs out at the current rate, in minutes unless `format.time` says otherwise. */
  timeLeft?: number
}

export const PARTS: BinRackPart[] = [
  { id: 'housings', label: 'Housings', tone: 'chart-5' },
  { id: 'brackets', label: 'Brackets', tone: 'chart-4' },
  { id: 'caps', label: 'Caps', tone: 'chart-3' },
  { id: 'seals', label: 'Seals', tone: 'chart-2' },
]

export const BINS: BinRackBin[] = [
  { id: 'h1', part: 'housings', label: 'Housings H-04', quantity: 22, capacity: 24, timeLeft: 55 },
  { id: 'b1', part: 'brackets', label: 'Brackets B-11', quantity: 17, capacity: 24, timeLeft: 41 },
  { id: 'c1', part: 'caps', label: 'Caps C-12', quantity: 6, capacity: 24, timeLeft: 14 },
  { id: 'h2', part: 'housings', label: 'Housings H-05', quantity: 19, capacity: 24, timeLeft: 48 },
  { id: 'b2', part: 'brackets', label: 'Brackets B-12', quantity: 14, capacity: 24, timeLeft: 33 },
  { id: 's1', part: 'seals', label: 'Seals S-02', quantity: 0, capacity: 24, timeLeft: 0 },
  { id: 's2', part: 'seals', label: 'Seals S-03', quantity: 11, capacity: 24, timeLeft: 26 },
  { id: 'h3', part: 'housings', label: 'Housings H-06', quantity: 20, capacity: 24, timeLeft: 50 },
]

/** The bins at or under this share of their capacity are low. */
export const LOW_BELOW = 0.25

export const DEFAULT_COPY = {
  title: 'Line-side stock',
  subtitle: (rack: string, bins: number) => `${rack} · ${bins} bins`,
  rack: 'Flow rack R3',
  lowBadge: (n: number) => `${n} low`,
  allStocked: 'All stocked',
  toRefill: (n: number): string => (new Intl.PluralRules('en').select(n) === 'one' ? 'bin to refill' : 'bins to refill'),
  minutes: (n: string) => `${n} min`,
  nextRefill: (time: string) => `run in ${time}`,
  drawingLabel: 'Bins on the rack',
  binList: 'Bins',
  bin: (label: string, quantity: string, state: string, emptyIn: string) => `${label}, ${quantity} left, ${state}${emptyIn ? `, ${emptyIn}` : ''}`,
  state: { ok: 'stocked', low: 'low', empty: 'empty' },
  tag: (label: string, quantity: string) => `${label} · ${quantity} left`,
  emptyIn: (time: string) => `empty in ~${time}`,
  isEmpty: 'empty now',
  keyLow: 'Low',
  keyEmpty: 'Empty',
  autoCall: 'Auto-call the tugger',
  loadingLabel: 'Loading the rack',
  retry: 'Retry',
  emptyTitle: 'No bins on this rack',
  emptyDescription: 'Bins show up here once the rack has some.',
  autoCallHint: (percent: string) => `when a bin drops below ${percent}`,
}

export type BinRackCopy = typeof DEFAULT_COPY
export type BinRackState = 'ok' | 'low' | 'empty'
