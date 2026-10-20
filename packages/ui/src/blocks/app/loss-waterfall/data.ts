/* A fictional line's day: pass yours through the block's props. */

export type LossWaterfallTone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

export interface LossWaterfallLoss {
  id: string
  label: string
  /** What it took off the start, in any unit; `format` and `copy.loss` say which. */
  value: number
  tone: LossWaterfallTone
  /** What to look at next: the drill-in row's title and detail. */
  drill?: { title: string; detail: string }
}

export const START = 490

export const LOSSES: LossWaterfallLoss[] = [
  { id: 'breakdowns', label: 'Breakdowns', value: 38, tone: 'chart-4', drill: { title: 'Breakdowns on Press 2', detail: '3 stops, longest 22 min' } },
  { id: 'changeover', label: 'Changeover', value: 24, tone: 'chart-2', drill: { title: 'Changeover to the B tool', detail: '24 min vs 18 min plan' } },
  { id: 'small', label: 'Small stops', value: 21, tone: 'chart-3', drill: { title: 'Small stops at Bend', detail: '14 stops under 2 min' } },
  { id: 'slow', label: 'Slow cycles', value: 42, tone: 'chart-5', drill: { title: 'Slow cycles on Weld 1', detail: '49 s vs 45 s takt' } },
  { id: 'scrap', label: 'Scrap', value: 15, tone: 'chart-1', drill: { title: 'Scrap at Paint', detail: '31 parts reworked' } },
]

export const DEFAULT_COPY = {
  title: 'Efficiency',
  subtitle: 'Line 3 · today',
  metric: 'OEE',
  change: (points: string) => `${points} pts`,
  drawingLabel: (start: string, steps: string, result: string, percent: string) => `Planned time ${start} min, less ${steps}, leaves ${result} min: ${percent}`,
  loss: (label: string, value: string) => `${label} ${value} min`,
  callout: (value: string) => `−${value} min`,
  legendLabel: 'Losses',
}

export type LossWaterfallCopy = typeof DEFAULT_COPY
