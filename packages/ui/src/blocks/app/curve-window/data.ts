import type { CurveWindowPoint, CurveWindowRange } from './geometry'

/* A fictional station's bolts: pass yours through the block's props. */

export type CurveWindowResult = 'ok' | 'nok'

export interface CurveWindowTrace {
  /** The part, "Part 118". */
  id: string
  /** The curve's points, `[x, y]` in order (the demo: angle in degrees, torque in newton-meters). */
  points: CurveWindowPoint[]
  result: CurveWindowResult
  /** Why it failed, shown in the callout: "soft joint at 47°". */
  note?: string
}

export interface CurveWindowSeries {
  id: string
  label: string
  /** The recent curves, oldest first: the last one is the current value. */
  curves: CurveWindowTrace[]
  /** Where a good curve ends. */
  window: CurveWindowRange
}

export interface CurveWindowAxis {
  /** What it measures, "angle": read in the chart's text alternative. */
  label: string
  /** Its unit, "°". A value reads as its number and this unit unless `format` says otherwise. */
  unit: string
  /** The lowest and highest value on the axis. Default 0 to 60 across, 0 to 30 up. */
  domain?: [min: number, max: number]
  /** Distance between ticks. Default 20 across, 10 up. */
  step?: number
  /** Formats one value of this axis, everywhere it shows. */
  format?: (value: number) => string
}

export interface CurveWindowAxes {
  x: CurveWindowAxis
  y: CurveWindowAxis
}

/** A smooth, rising curve that ends at `endAngle` and `endTorque`; `soft` > 1 starts it later and steeper, like a joint that gives. Deterministic, with a little ripple per `seed`. */
function curve(id: string, endAngle: number, endTorque: number, result: CurveWindowResult, seed: number, soft = 1, note?: string): CurveWindowTrace {
  const points: CurveWindowPoint[] = []
  for (let angle = 0; angle < endAngle; angle += 2) points.push([angle, rise(angle, endAngle, endTorque, seed, soft)])
  points.push([endAngle, endTorque])
  return { id, points, result, note }
}

function rise(angle: number, endAngle: number, endTorque: number, seed: number, soft: number) {
  const share = angle / endAngle
  const ripple = Math.sin(angle * 0.7 + seed) * 0.22 * share
  return Math.max(0, Math.round((endTorque * share ** (2.3 * soft) + ripple) * 10) / 10)
}

const OK = [
  [41, 25.9],
  [39, 24.7],
  [42, 26.4],
  [37, 24.1],
  [40, 25.2],
  [38, 24.6],
  [43, 26.8],
  [36, 23.6],
  [41, 25.4],
  [39, 24.9],
] as const

const bolt = (id: string, label: string, curves: CurveWindowTrace[]): CurveWindowSeries => ({ id, label, curves, window: { xFrom: 34, xTo: 46, yFrom: 22, yTo: 28 } })

export const SERIES: CurveWindowSeries[] = [
  bolt('bolt-1', 'Bolt 1', [
    ...OK.map(([a, t], i) => curve(`Part ${108 + i}`, a, t, 'ok', i)),
    curve('Part 118', 39, 24.4, 'ok', 3),
    curve('Part 119', 40, 25.1, 'ok', 4),
    curve('Part 120', 38, 24.2, 'ok', 5),
  ]),
  bolt('bolt-2', 'Bolt 2', [
    ...OK.map(([a, t], i) => curve(`Part ${108 + i}`, a, t, 'ok', i + 2)),
    curve('Part 118', 47, 21.4, 'nok', 1, 1.18, 'soft joint at 47°'),
    curve('Part 119', 40, 25.3, 'ok', 6),
    curve('Part 120', 38, 24.8, 'ok', 7),
  ]),
  bolt('bolt-3', 'Bolt 3', [
    ...OK.map(([a, t], i) => curve(`Part ${108 + i}`, a, t - 0.4, 'ok', i + 5)),
    curve('Part 118', 41, 25.0, 'ok', 2),
    curve('Part 119', 42, 25.6, 'ok', 8),
    curve('Part 120', 40, 24.9, 'ok', 9),
  ]),
]

export const AXES: CurveWindowAxes = {
  x: { label: 'angle', unit: '°', domain: [0, 60], step: 20 },
  y: { label: 'torque', unit: 'Nm', domain: [0, 30], step: 10 },
}

export const DEFAULT_COPY = {
  title: 'Tightening',
  subtitle: (traces: number) => `Station 4 · M8 bolt · last ${traces}`,
  nokCount: (n: number) => `${n} NOK`,
  allOk: 'All OK',
  seriesLabel: 'Bolt',
  at: (x: string) => `at ${x}`,
  ok: 'OK',
  nok: 'NOK',
  chartLabel: (series: string, traces: number, nok: number, window: string, y: string, x: string) =>
    `${series}: ${y} against ${x} for the last ${traces} parts, ${nok} outside the pass window of ${window}`,
  window: (xs: string, ys: string) => `${xs} and ${ys}`,
  keyOk: 'OK',
  keyLast: 'Last',
  keyNok: 'NOK',
  keyWindow: 'Window',
  callout: (id: string, y: string) => `${id} · ${y}`,
  traceList: 'Parts',
  trace: (id: string, result: string, y: string, x: string, note: string) => `${id}: ${result}, ${y} at ${x}${note ? `, ${note}` : ''}`,
  loadingLabel: 'Loading the curves',
  retry: 'Retry',
  emptyTitle: 'Nothing to chart',
  emptyDescription: 'The curves show up here once there are some.',
}

export type CurveWindowCopy = typeof DEFAULT_COPY
