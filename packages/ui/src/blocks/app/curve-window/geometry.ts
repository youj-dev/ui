export type CurveWindowPoint = readonly [x: number, y: number]

export interface CurveWindowRange {
  xFrom: number
  xTo: number
  yFrom: number
  yTo: number
}

export interface Plot {
  /** The drawing's plot area in user units: its left and right x, its top and bottom y. */
  x0: number
  x1: number
  y0: number
  y1: number
  /** What the left and right edges, and the bottom and top, stand for. */
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/** Where an x value falls along the plot's width. */
export const xOf = (plot: Plot, x: number) => plot.x0 + ((x - plot.minX) / (plot.maxX - plot.minX)) * (plot.x1 - plot.x0)

/** Where a y value falls up the plot's height (the bottom is `minY`). */
export const yOf = (plot: Plot, y: number) => plot.y1 - ((y - plot.minY) / (plot.maxY - plot.minY)) * (plot.y1 - plot.y0)

const f = (n: number) => Math.round(n * 10) / 10

/** A curve as a polyline path through its points on the plot. */
export function curvePath(plot: Plot, points: readonly CurveWindowPoint[]): string {
  return points.map(([a, t], i) => `${i ? 'L' : 'M'}${f(xOf(plot, a))} ${f(yOf(plot, t))}`).join('')
}

/** A curve's last point: where it ended. */
export function endOf(points: readonly CurveWindowPoint[]): CurveWindowPoint {
  return points[points.length - 1] ?? [0, 0]
}

/** Whether a curve ended inside the window, edges included. */
export function endsInWindow(points: readonly CurveWindowPoint[], window: CurveWindowRange): boolean {
  const [x, y] = endOf(points)
  return x >= window.xFrom && x <= window.xTo && y >= window.yFrom && y <= window.yTo
}

/** Evenly spaced axis ticks from `min` to `max`, `step` apart. */
export function ticks(max: number, step: number, min = 0): number[] {
  const out: number[] = []
  for (let v = min; v <= max + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6)
  return out
}

/** A number read with its unit: tight for a symbol ("38°"), spaced for a word ("24 Nm"). */
export const withUnit = (value: string, unit: string) => `${value}${/^\p{L}/u.test(unit) ? ' ' : ''}${unit}`
