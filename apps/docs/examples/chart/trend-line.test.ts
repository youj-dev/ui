import { linearTrend, sumEvery } from './trend-line'

describe('linearTrend', () => {
  test('recovers the line a series sits on', () => {
    const { slope, intercept, fitted } = linearTrend([3, 5, 7, 9])
    expect(slope).toBeCloseTo(2)
    expect(intercept).toBeCloseTo(3)
    expect(fitted).toEqual([3, 5, 7, 9].map((v) => expect.closeTo(v)))
  })

  test('fits the least-squares line through noisy values', () => {
    const { slope, intercept } = linearTrend([1, 2, 4])
    expect(slope).toBeCloseTo(1.5)
    expect(intercept).toBeCloseTo(5 / 6)
  })

  test('a flat series has no slope and a falling one a negative slope', () => {
    expect(linearTrend([4, 4, 4]).slope).toBe(0)
    expect(linearTrend([9, 6, 3]).slope).toBeCloseTo(-3)
  })

  test('one value is its own line', () => {
    expect(linearTrend([5])).toEqual({ slope: 0, intercept: 5, fitted: [5] })
    expect(linearTrend([])).toEqual({ slope: 0, intercept: 0, fitted: [] })
  })
})

describe('sumEvery', () => {
  test('groups months into quarters', () => {
    expect(sumEvery([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 3)).toEqual([6, 15, 24, 33])
  })

  test('keeps a short last group', () => {
    expect(sumEvery([1, 2, 3, 4], 3)).toEqual([6, 4])
  })
})
