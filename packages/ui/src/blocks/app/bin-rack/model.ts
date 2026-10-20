import type { BinRackState } from './data'

/** A bin's state: empty at none, low at or under `lowBelow` of its capacity (0–1). */
export function binState(quantity: number, capacity: number, lowBelow: number): BinRackState {
  if (quantity <= 0) return 'empty'
  return capacity > 0 && quantity / capacity <= lowBelow ? 'low' : 'ok'
}

/** Where bin `index` sits on the rack: two rows, filled across, so 8 bins are 4 columns by 2. */
export function binCell(index: number, count: number): { col: number; row: number } {
  const cols = Math.max(1, Math.ceil(count / 2))
  return { col: index % cols, row: Math.floor(index / cols) }
}

/** How many bins need a refill: the low and the empty ones. */
export function refillCount(states: readonly BinRackState[]): number {
  return states.filter((s) => s !== 'ok').length
}

/** How much of a bin its stock fills, 0–1, never under a sliver while something is left. */
export function fillOf(quantity: number, capacity: number): number {
  if (quantity <= 0 || capacity <= 0) return 0
  return Math.min(1, Math.max(0.12, quantity / capacity))
}
