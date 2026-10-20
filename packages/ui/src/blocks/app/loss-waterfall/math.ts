export interface WaterfallLoss {
  id: string
  value: number
}

export interface WaterfallStep {
  id: string
  kind: 'start' | 'loss' | 'result'
  /** Where it starts and ends on the value scale (0 is the floor, `start` the top). */
  bottom: number
  top: number
}

/** The start, then each loss cutting the level down from where the last one left it, then what is left standing. */
export function waterfallSteps(start: number, losses: readonly WaterfallLoss[]): { steps: WaterfallStep[]; result: number; ratio: number } {
  const steps: WaterfallStep[] = [{ id: 'start', kind: 'start', bottom: 0, top: start }]
  let level = start
  for (const loss of losses) {
    const value = Math.min(Math.max(0, loss.value), level)
    steps.push({ id: loss.id, kind: 'loss', bottom: level - value, top: level })
    level -= value
  }
  steps.push({ id: 'result', kind: 'result', bottom: 0, top: level })
  return { steps, result: level, ratio: start > 0 ? level / start : 0 }
}

/** The loss that cost the most (the first of equals), or undefined without any. */
export function biggestLoss<T extends WaterfallLoss>(losses: readonly T[]): T | undefined {
  return losses.reduce<T | undefined>((best, loss) => (!best || loss.value > best.value ? loss : best), undefined)
}

/** Grid units for `value` when `start` stands `height` tall. */
export const valueToHeight = (value: number, start: number, height: number) => (start > 0 ? (value / start) * height : 0)
