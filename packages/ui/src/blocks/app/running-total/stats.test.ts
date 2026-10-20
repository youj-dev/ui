import { bestDay, changeBetween, clearSpot, cumulative, gaps, passedAt, rectHitsLine, spreadLabels } from './stats'

describe('Running total stats', () => {
  test('sums readings into running totals and finds the day a total is passed', () => {
    const running = cumulative([3, 5, 2, 10])
    expect(running).toEqual([3, 8, 10, 20])
    expect(passedAt(running, 10)).toBe(2)
    expect(passedAt(running, 21)).toBeUndefined()
  })

  test('the best day is the first with the most', () => {
    expect(bestDay([3, 9, 9, 1])).toBe(1)
    expect(bestDay([])).toBeUndefined()
    expect(changeBetween(120, 100)).toBeCloseTo(0.2)
    expect(changeBetween(1, 0)).toBeUndefined()
  })

  test('the gap splits where the lines cross, each stretch wholly ahead or behind', () => {
    const result = gaps([5, 6, 5, 9], [4, 4, 8, 8])
    expect(result.map((g) => g.ahead)).toEqual([true, false, true])
    // The first crossing sits between days 1 and 2, where 6 - 4 = 2 meets 5 - 8 = -3: a fifth of the way.
    expect(result[0]!.points.at(-1)!.x).toBeCloseTo(1.4)
    expect(result[1]!.points[0]!.x).toBeCloseTo(1.4)
    expect(result[0]!.points.at(-1)!.current).toBeCloseTo(result[0]!.points.at(-1)!.previous)
    // Periods of different lengths are compared over the days they share.
    expect(gaps([1, 2, 3], [0, 1]).flatMap((g) => g.points.map((p) => p.x))).toEqual([0, 1])
  })

  test('labels that crowd are nudged apart evenly and kept in bounds', () => {
    expect(spreadLabels([100, 104], 20, 0, 200)).toEqual([92, 112])
    expect(spreadLabels([2, 6], 20, 0, 200)).toEqual([0, 20])
    expect(spreadLabels([50, 120], 20, 0, 200)).toEqual([50, 120])
  })

  test('a note takes the first spot that no line runs through', () => {
    const line = [
      { x: 0, y: 100 },
      { x: 100, y: 100 },
    ]
    expect(rectHitsLine({ left: 20, top: 90, width: 30, height: 20 }, line)).toBe(true)
    expect(rectHitsLine({ left: 20, top: 40, width: 30, height: 20 }, line)).toBe(false)
    const bounds = { left: 0, top: 0, width: 100, height: 200 }
    const blocked = { left: 20, top: 90, width: 30, height: 20 }
    const free = { left: 20, top: 40, width: 30, height: 20 }
    expect(clearSpot([blocked, free], [line], bounds)).toBe(free)
    // Outside the plot doesn't count; with nothing clear, the first inside it is used.
    expect(clearSpot([{ left: -40, top: 40, width: 30, height: 20 }, blocked], [line], bounds)).toBe(blocked)
  })
})
