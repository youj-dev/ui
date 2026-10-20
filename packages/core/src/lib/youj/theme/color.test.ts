import { contrast, formatOklch, inGamut, linearToOklch, oklchToLinear, over, parseColor, toHex } from './color'

const hex = (input: string) => {
  const rgb = parseColor(input)
  return rgb ? toHex(rgb) : null
}

test.each([
  ['#3554fc', '#3554fc'],
  ['#35F', '#3355ff'],
  ['#3554fcaa', '#3554fc'],
  ['rgb(53 84 252)', '#3554fc'],
  ['rgba(53, 84, 252, 0.5)', '#3554fc'],
  ['rgb(100% 0% 50%)', '#ff0080'],
  ['hsl(210 50% 40%)', '#336699'],
  ['hsl(210, 50%, 40%)', '#336699'],
  ['hsla(0.5turn 100% 50% / 0.2)', '#00ffff'],
  ['oklch(0.54 0.25 268)', '#3554fc'],
  ['oklch(54% 0.25 268deg)', '#3554fc'],
  ['oklch(1 0 none)', '#ffffff'],
  ['oklab(0.54 -0.0087 -0.2498)', '#3554fc'],
  ['color(srgb 1 0 0.5)', '#ff0080'],
  ['color(srgb-linear 1 0 0.2159)', '#ff0080'],
  ['color(display-p3 1 1 1)', '#ffffff'],
])('parses %s', (input, expected) => {
  expect(hex(input)).toBe(expected)
})

test.each(['blurple', '#12', 'rgb(1 2)', 'lab(50 20 30)', ''])('rejects %j', (input) => {
  expect(parseColor(input)).toBeNull()
})

test('round-trips OKLCH through linear sRGB', () => {
  const [l, c, h] = linearToOklch(oklchToLinear([0.54, 0.25, 268]))
  expect([l, c, h].map((v) => Number(v.toFixed(5)))).toEqual([0.54, 0.25, 268])
})

test('formats OKLCH the way the CSS writes it', () => {
  expect(formatOklch([0.985, 0.0015, 270])).toBe('oklch(0.985 0.0015 270)')
  expect(formatOklch([0.995, 0.00000001, 123])).toBe('oklch(0.995 0 0)')
  expect(formatOklch([0.6234999, 0.0091234, 269.999])).toBe('oklch(0.6235 0.0091 270)')
})

test('measures contrast as painted: clipped to sRGB, translucency over the backdrop', () => {
  expect(contrast([0, 0, 0], [1, 1, 1])).toBeCloseTo(21, 5)
  expect(contrast([-0.2, 0, 0], [1.3, 1, 1])).toBeCloseTo(21, 5)
  expect(inGamut([1.2, 0, 0])).toBe(false)
  expect(over([0, 0, 0], 0, [1, 1, 1])).toEqual([1, 1, 1])
  // Half-transparent black over white is mid-gray in gamma space, 0.214 in linear light.
  expect(over([0, 0, 0], 0.5, [1, 1, 1])[0]).toBeCloseTo(0.214, 3)
})
