import { contrast, grade, oklchToRgb, parseOklch } from './color'

/* The palette itself is derived from the theme contract now; its AA and gamut
 * guarantees are tested for every preset in src/lib/youj/theme. This file
 * covers the helpers the docs pages use. */

test('parses oklch values', () => {
  expect(parseOklch('oklch(0.54 0.25 268)')).toEqual([0.54, 0.25, 268])
  expect(parseOklch('oklch(54% 0.25 268deg)')).toEqual([0.54, 0.25, 268])
  expect(parseOklch('#fff')).toBeNull()
})

test('grades contrast on the WCAG scale', () => {
  const black = oklchToRgb('oklch(0 0 0)')!
  const white = oklchToRgb('oklch(1 0 0)')!
  expect(contrast(black, white)).toBeCloseTo(21, 1)
  expect(grade(7)).toBe('AAA')
  expect(grade(4.5)).toBe('AA')
  expect(grade(3)).toBe('AA Large')
  expect(grade(2.9)).toBe('Fail')
})
