import { groupYears, projectCompound } from './project'

describe('projectCompound', () => {
  test('compounds monthly deposits at the monthly rate and matches the closed form', () => {
    const rows = projectCompound({ monthly: 250, years: 10, rate: 0.07, initial: 2500 })
    const r = 0.07 / 12
    const n = 120
    const closed = 2500 * (1 + r) ** n + (250 * ((1 + r) ** n - 1)) / r
    expect(rows).toHaveLength(10)
    expect(rows[9]!.total).toBeCloseTo(closed, 6)
    expect(rows[9]!.total).toBeCloseTo(48295.36, 2)
  })

  test('reports what was added and what the gain came to, year by year', () => {
    const rows = projectCompound({ monthly: 100, years: 3, rate: 0.06, initial: 1000 })
    expect(rows.map((r) => r.year)).toEqual([1, 2, 3])
    expect(rows.map((r) => r.added)).toEqual([2200, 3400, 4600])
    for (const row of rows) expect(row.gain).toBeCloseTo(row.total - row.added, 9)
    expect(rows[0]!.gain).toBeGreaterThan(0)
    expect(rows[2]!.gain).toBeGreaterThan(rows[1]!.gain)
  })

  test('with no rate the total is just what was added', () => {
    const rows = projectCompound({ monthly: 200, years: 2, rate: 0, initial: 500 })
    expect(rows.map((r) => r.total)).toEqual([2900, 5300])
    expect(rows.every((r) => r.gain === 0)).toBe(true)
  })

  test('treats a negative, fractional or non-finite input as the nearest sensible value', () => {
    expect(projectCompound({ monthly: 100, years: 0, rate: 0.05 })).toEqual([])
    expect(projectCompound({ monthly: 100, years: -3, rate: 0.05 })).toEqual([])
    expect(projectCompound({ monthly: 100, years: Number.NaN, rate: 0.05 })).toEqual([])
    expect(projectCompound({ monthly: 100, years: 2.9, rate: 0.05 })).toHaveLength(2)
    expect(projectCompound({ monthly: -100, years: 1, rate: -0.05, initial: Number.NaN })[0]!.total).toBe(0)
  })

  test('a higher rate or a larger deposit never lowers the end total', () => {
    const end = (monthly: number, rate: number) => projectCompound({ monthly, years: 15, rate }).at(-1)!.total
    expect(end(200, 0.07)).toBeGreaterThan(end(200, 0.05))
    expect(end(300, 0.05)).toBeGreaterThan(end(200, 0.05))
  })
})

describe('groupYears', () => {
  const years = (n: number) => Array.from({ length: n }, (_, i) => ({ year: i + 1 }))

  test('keeps every year when there are few enough', () => {
    expect(groupYears(years(8)).map((r) => r.year)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  test('picks evenly spaced years and always ends on the last', () => {
    expect(groupYears(years(25)).map((r) => r.year)).toEqual([3, 6, 9, 12, 15, 18, 21, 24, 25])
    expect(groupYears(years(40)).map((r) => r.year)).toEqual([4, 8, 12, 16, 20, 24, 28, 32, 36, 40])
  })

  test('never returns more than the most it is asked for', () => {
    for (let n = 1; n <= 60; n++) expect(groupYears(years(n), 10).length).toBeLessThanOrEqual(10)
  })
})
