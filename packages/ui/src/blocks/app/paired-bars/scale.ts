/* The pure parts of PairedBars: one axis both series share, linear or
 * log, with the ticks it is drawn with and a position for every value. */

export type ScaleKind = 'linear' | 'log'

export interface AxisScale {
  kind: ScaleKind
  /** Where the axis starts: 0 when linear, a power of ten when log. */
  min: number
  /** Where it ends: a round number at or above the largest value. */
  max: number
  /** Round values to label and draw a gridline at, from `min` to `max`. */
  ticks: number[]
  /** Where `value` sits along the axis, 0 to 1. A value at or below the start is 0. */
  position: (value: number) => number
}

const STEPS = [1, 2, 2.5, 4, 5, 8, 10]

/** The smallest round number (1, 2, 2.5, 4, 5 or 8 times a power of ten) at or above `value`. */
export function niceCeil(value: number) {
  if (!(value > 0)) return 1
  const power = 10 ** Math.floor(Math.log10(value))
  const unit = value / power
  return (STEPS.find((s) => s >= unit - 1e-9) ?? 10) * power
}

const STEP_SIZES = [1, 2, 2.5, 5, 10]

/** The axis for `values` (the larger of any two series): ticks at every power of ten from the one under the smallest value up to a round top, or evenly from zero. */
export function makeScale(values: readonly number[], kind: ScaleKind = 'log'): AxisScale {
  const positive = values.filter((v) => Number.isFinite(v) && v > 0)
  const largest = positive.length ? Math.max(...positive) : 1

  if (kind === 'linear') {
    const raw = largest / 4
    const power = 10 ** Math.floor(Math.log10(raw))
    const step = (STEP_SIZES.find((s) => s * power >= raw - 1e-9) ?? 10) * power
    const max = Math.ceil(largest / step - 1e-9) * step
    const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => Math.round(i * step * 1e6) / 1e6)
    return { kind, min: 0, max, ticks, position: (v) => (max > 0 ? Math.min(1, Math.max(0, v / max)) : 0) }
  }

  const smallest = positive.length ? Math.min(...positive) : 1
  const min = 10 ** Math.floor(Math.log10(smallest))
  let max = niceCeil(largest)
  if (max <= min) max = min * 10
  const ticks: number[] = []
  for (let p = min; p < max * (1 - 1e-9); p *= 10) ticks.push(p)
  ticks.push(max)
  const span = Math.log(max) - Math.log(min)
  return { kind, min, max, ticks, position: (v) => (v > min ? Math.min(1, (Math.log(v) - Math.log(min)) / span) : 0) }
}
