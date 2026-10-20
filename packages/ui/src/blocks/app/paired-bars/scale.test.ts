import { makeScale, niceCeil } from './scale'

describe('niceCeil', () => {
  test('rounds up to 1, 2, 2.5, 4, 5 or 8 times a power of ten', () => {
    expect(niceCeil(38_000)).toBe(40_000)
    expect(niceCeil(41_000)).toBe(50_000)
    expect(niceCeil(100)).toBe(100)
    expect(niceCeil(101)).toBe(200)
    expect(niceCeil(0.7)).toBeCloseTo(0.8)
    expect(niceCeil(0)).toBe(1)
  })
})

describe('log scale', () => {
  const scale = makeScale([120, 860, 2_400, 38_000], 'log')

  test('ticks run from the decade under the smallest value to a round top', () => {
    expect(scale.ticks).toEqual([100, 1_000, 10_000, 40_000])
    expect(scale.min).toBe(100)
    expect(scale.max).toBe(40_000)
  })

  test('puts a value on the axis by its logarithm, and the ends at 0 and 1', () => {
    expect(scale.position(100)).toBe(0)
    expect(scale.position(40_000)).toBe(1)
    expect(scale.position(1_000)).toBeCloseTo(Math.log(10) / Math.log(400))
    expect(scale.position(10)).toBe(0)
    expect(scale.position(0)).toBe(0)
    expect(scale.position(1e9)).toBe(1)
  })

  test('a value that is a power of ten is a tick, not a new top', () => {
    expect(makeScale([10, 1_000], 'log').ticks).toEqual([10, 100, 1_000])
  })

  test('survives no values and a single value', () => {
    expect(makeScale([], 'log').ticks.length).toBeGreaterThan(1)
    const one = makeScale([500], 'log')
    expect(one.min).toBe(100)
    expect(one.max).toBe(500)
    expect(one.position(500)).toBe(1)
  })
})

describe('linear scale', () => {
  test('ticks run evenly from zero to a round top that holds the largest value', () => {
    const scale = makeScale([1_200, 38_000], 'linear')
    expect(scale.ticks).toEqual([0, 10_000, 20_000, 30_000, 40_000])
    expect(scale.max).toBe(40_000)
    expect(scale.position(10_000)).toBe(0.25)
    expect(scale.position(-5)).toBe(0)
  })

  test('picks a friendly step for small numbers', () => {
    expect(makeScale([7], 'linear').ticks).toEqual([0, 2, 4, 6, 8])
    expect(makeScale([0.9], 'linear').ticks).toEqual([0, 0.25, 0.5, 0.75, 1])
  })
})
