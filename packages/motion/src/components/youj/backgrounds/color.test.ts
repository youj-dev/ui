import { accentFamily, parseColor, rgbToOklab } from './color'

test('parses the serialisations browsers use for computed token colors', () => {
  expect(parseColor('rgb(255, 128, 0)')).toEqual([1, 128 / 255, 0])
  expect(parseColor('rgba(0 0 0 / 0.5)')).toEqual([0, 0, 0])
  expect(parseColor('color(srgb 0.25 0.5 1)')).toEqual([0.25, 0.5, 1])
  const white = parseColor('oklch(1 0 0)')!
  white.forEach((c) => expect(c).toBeCloseTo(1, 3))
  const [L] = rgbToOklab(parseColor('oklch(0.6 0.23 262)')!)
  expect(L).toBeCloseTo(0.6, 2)
  expect(parseColor('var(--color-accent)')).toBeNull()
})

test('accent family keeps the accent first and stays in gamut', () => {
  const family = accentFamily([0.2, 0.4, 1], [[40, 0, 1], [-50, 0.05, 0.8]])
  expect(family[0]).toEqual([0.2, 0.4, 1])
  expect(family).toHaveLength(3)
  for (const c of family.flat()) expect(c).toBeGreaterThanOrEqual(0), expect(c).toBeLessThanOrEqual(1)
})
