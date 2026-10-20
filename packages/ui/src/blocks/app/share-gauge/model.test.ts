import { groupTop, percents, pointAt, sectorPath, spans } from './model'

const items = (...values: number[]) => values.map((value, i) => ({ id: `i${i}`, value }))

describe('groupTop', () => {
  test('ranks largest first and folds everything past the top into one tail', () => {
    const { kept, rest, restValue } = groupTop(items(5, 40, 10, 30, 20, 1, 2, 3), 3)
    expect(kept.map((i) => i.value)).toEqual([40, 30, 20])
    expect(rest.map((i) => i.value)).toEqual([10, 5, 3, 2, 1])
    expect(restValue).toBe(21)
  })

  test('does not fold a tail of one', () => {
    const { kept, rest } = groupTop(items(4, 3, 2, 1), 3)
    expect(kept).toHaveLength(4)
    expect(rest).toEqual([])
  })

  test('leaves empty and negative parts out and never mutates its input', () => {
    const input = items(0, 7, -2, 3)
    const { kept } = groupTop(input, 5)
    expect(kept.map((i) => i.value)).toEqual([7, 3])
    expect(input.map((i) => i.value)).toEqual([0, 7, -2, 3])
  })
})

describe('percents', () => {
  test('whole numbers that always add up to 100', () => {
    expect(percents([1, 1, 1]).reduce((a, b) => a + b, 0)).toBe(100)
    expect(percents([1, 1, 1])).toEqual([34, 33, 33])
    expect(percents([50, 30, 20])).toEqual([50, 30, 20])
  })

  test('zero for an empty whole', () => {
    expect(percents([0, 0])).toEqual([0, 0])
  })
})

describe('spans', () => {
  test('lays values end to end over the half turn', () => {
    const [a, b] = spans([1, 3])
    expect(a).toEqual([0, 0.25])
    expect(b![0]).toBe(0.25)
    expect(b![1]).toBe(1)
  })
})

describe('geometry', () => {
  test('the half turn runs from the left end through the top to the right end', () => {
    expect(pointAt(0, 100).x).toBeCloseTo(0)
    expect(pointAt(0.5, 100).y).toBeCloseTo(0)
    expect(pointAt(1, 100).x).toBeCloseTo(200)
  })

  test('a segment too thin to draw has no path', () => {
    expect(sectorPath(0.5, 0.5)).toBe('')
    expect(sectorPath(0, 0.3)).toMatch(/^M.*Z$/)
  })
})
