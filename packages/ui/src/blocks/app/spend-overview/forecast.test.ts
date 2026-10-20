import { forecastSpend } from './forecast'

describe('forecastSpend', () => {
  test('carries the running total to the period end at the pace of the latest days', () => {
    const result = forecastSpend({ daily: [100, 100, 100, 100], days: 6, limit: 1000, window: 2 })
    expect(result.actual).toEqual([100, 200, 300, 400])
    expect(result.pace).toBe(100)
    expect(result.forecast.map((p) => p.value)).toEqual([500, 600])
    expect(result.projected).toBe(600)
  })

  test('a window follows a change of pace instead of the whole period', () => {
    const daily = [50, 50, 50, 150, 150]
    expect(forecastSpend({ daily, days: 7, limit: 9999, window: 2 }).projected).toBe(750)
    expect(forecastSpend({ daily, days: 7, limit: 9999, window: 5 }).projected).toBe(630)
  })

  test('names the day the forecast first reaches the limit', () => {
    const result = forecastSpend({ daily: [100, 100, 100], days: 10, limit: 550 })
    // 300 spent, 100 a day: 400, 500, 600 on days 4, 5 and 6.
    expect(result.crossesOn).toBe(6)
    expect(result.crossed).toBe(false)
  })

  test('is null when the period ends under the limit', () => {
    const result = forecastSpend({ daily: [10, 10], days: 5, limit: 1000 })
    expect(result.crossesOn).toBeNull()
    expect(result.projected).toBe(50)
  })

  test('a limit already passed is crossed on the day it was reached', () => {
    const result = forecastSpend({ daily: [400, 400, 400], days: 6, limit: 700 })
    expect(result.crossed).toBe(true)
    expect(result.crossesOn).toBe(2)
  })

  test('the likely range widens with each day ahead and never dips under what is spent', () => {
    const { forecast } = forecastSpend({ daily: [10, 300, 10, 300], days: 8, limit: 99999, window: 4 })
    const widths = forecast.map((p) => p.high - p.low)
    expect(widths).toEqual([...widths].sort((a, b) => a - b))
    expect(forecast.every((p) => p.low >= 620 && p.low <= p.value && p.value <= p.high)).toBe(true)
  })

  test('a steady pace has no range, and no days yet means nothing to carry', () => {
    const steady = forecastSpend({ daily: [20, 20, 20], days: 5, limit: 1000 })
    expect(steady.forecast.every((p) => p.low === p.value && p.high === p.value)).toBe(true)
    const none = forecastSpend({ daily: [], days: 5, limit: 1000 })
    expect(none.actual).toEqual([])
    expect(none.forecast).toHaveLength(5)
    expect(none.projected).toBe(0)
    expect(none.crossesOn).toBeNull()
  })

  test('a finished period has no forecast: it ends where it is', () => {
    const result = forecastSpend({ daily: [10, 20, 30], days: 3, limit: 100 })
    expect(result.forecast).toEqual([])
    expect(result.projected).toBe(60)
    expect(result.high).toBe(60)
  })
})
