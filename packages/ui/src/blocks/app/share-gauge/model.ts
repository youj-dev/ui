/* The pure parts of ShareGauge: ranking with a folded tail, whole-number
 * shares that add up, and the half-donut's geometry. */

export interface Ranked<T> {
  /** Largest first, the tail past `top` left out when it is folded. */
  kept: T[]
  /** The folded tail; empty when nothing is folded. */
  rest: T[]
  /** The tail's sum. */
  restValue: number
}

/** `items` largest first; past the first `top`, the rest fold into one tail. A tail of one is not folded: "Other (1)" would hide a name for nothing. */
export function groupTop<T extends { value: number }>(items: readonly T[], top: number): Ranked<T> {
  const sorted = items.filter((i) => i.value > 0).sort((a, b) => b.value - a.value)
  const keep = Math.max(1, Math.floor(top))
  const fold = sorted.length > keep + 1
  const rest = fold ? sorted.slice(keep) : []
  return { kept: fold ? sorted.slice(0, keep) : sorted, rest, restValue: rest.reduce((sum, i) => sum + i.value, 0) }
}

/** Whole percents of `values` that add up to 100 (largest remainder); all zero when the values are. */
export function percents(values: readonly number[]): number[] {
  const total = values.reduce((sum, v) => sum + Math.max(0, v), 0)
  if (total <= 0) return values.map(() => 0)
  const exact = values.map((v) => (Math.max(0, v) / total) * 100)
  const whole = exact.map(Math.floor)
  let left = 100 - whole.reduce((sum, w) => sum + w, 0)
  const order = exact.map((e, i) => [e - whole[i]!, i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1])
  for (const [, i] of order) {
    if (left <= 0) break
    whole[i]!++
    left--
  }
  return whole
}

/** Where each value's arc starts and ends along a half turn: fractions of the half, 0 to 1, left to right. */
export function spans(values: readonly number[]): [number, number][] {
  const total = values.reduce((sum, v) => sum + Math.max(0, v), 0)
  let at = 0
  return values.map((v) => {
    const from = at
    at += total > 0 ? Math.max(0, v) / total : 0
    return [from, at]
  })
}

export const CENTER = 100
export const OUTER = 96
export const INNER = 68
/** How far a segment is pulled in from its edges: the stroke that rounds it adds the same back. */
export const ROUND = 2.5

/** Where the arc at `fraction` of the half turn sits at `radius`, in the gauge's 200 by 104 box. */
export function pointAt(fraction: number, radius: number) {
  const angle = fraction * Math.PI
  return { x: CENTER - radius * Math.cos(angle), y: CENTER - radius * Math.sin(angle) }
}

const p = (fraction: number, radius: number) => {
  const { x, y } = pointAt(fraction, radius)
  return `${x.toFixed(2)},${y.toFixed(2)}`
}

/** A band segment from `from` to `to` (fractions of the half turn), inset by ROUND so a stroke of 2 * ROUND in its own color rounds the corners. Empty when it is too thin to draw. */
export function sectorPath(from: number, to: number) {
  const r1 = OUTER - ROUND
  const r0 = INNER + ROUND
  const a = from + ROUND / r1 / Math.PI
  const b = to - ROUND / r1 / Math.PI
  const a0 = from + ROUND / r0 / Math.PI
  const b0 = to - ROUND / r0 / Math.PI
  if (b - a < 0.001 || b0 - a0 < 0.001) return ''
  return `M${p(a, r1)} A${r1},${r1} 0 0 1 ${p(b, r1)} L${p(b0, r0)} A${r0},${r0} 0 0 0 ${p(a0, r0)} Z`
}
