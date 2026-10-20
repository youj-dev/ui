import { evalCss } from '../src/data/css-math'
import { apply, bounds, multiply, parseCssTransform, parsePath, parseSvgTransform, pathLength, rotate, toPathData, translate } from '../src/data/geometry'

describe('path data', () => {
  test('relative commands, H/V and shorthands become absolute lines and cubics', () => {
    expect(toPathData(parsePath('M2 3 h4 v2 H1 V0 z'))).toBe('M 2 3 L 6 3 L 6 5 L 1 5 L 1 0 Z')
    expect(toPathData(parsePath('M6 6.5 h.01'))).toBe('M 6 6.5 L 6.01 6.5')
    const q = parsePath('M0 0 Q 5 10 10 0 T 20 0')
    expect(q.map((s) => s.type)).toEqual(['M', 'C', 'C'])
  })

  test('arcs become cubics that trace the same circle', () => {
    const half = parsePath('M3 12 A9 9 0 0 1 21 12')
    expect(pathLength(half)).toBeCloseTo(Math.PI * 9, 1)
    const b = bounds(half)
    expect(b.minY).toBeCloseTo(3, 1)
    const full = parsePath('M12 3 A9 9 0 1 1 12 21 A9 9 0 1 1 12 3')
    expect(pathLength(full)).toBeCloseTo(2 * Math.PI * 9, 1)
  })

  test('implicit line-tos after a move-to, and arc flags without separators', () => {
    expect(parsePath('M0 0 10 0 10 10').map((s) => s.type)).toEqual(['M', 'L', 'L'])
    expect(parsePath('M0 0 a5 5 0 015 5').at(-1)).toMatchObject({ x: 5, y: 5 })
  })
})

describe('transforms', () => {
  test('SVG transform lists compose left to right', () => {
    const m = parseSvgTransform('translate(-0.5 1.75) rotate(45 12 12)')
    const [x, y] = apply(m, 12, 12)
    expect(x).toBeCloseTo(11.5)
    expect(y).toBeCloseTo(13.75)
  })

  test('CSS transforms read px and angle units', () => {
    const [x, y] = apply(parseCssTransform('translateY(6px) rotate(0.5turn)'), 1, 0)
    expect(x).toBeCloseTo(-1)
    expect(y).toBeCloseTo(6)
    expect(apply(multiply(translate(12, 12), multiply(rotate(90), translate(-12, -12))), 12, 0).map((v) => Math.round(v))).toEqual([24, 12])
  })
})

describe('css maths', () => {
  test('calc, min, max and var() with the theme contract', () => {
    expect(evalCss('min(calc(var(--yj-radius) * 4 / 3), 1.25rem)', { 'yj-radius': '1rem' })).toBe(20)
    expect(evalCss('calc(max(1.5rem, 1.5rem + var(--yj-density) * 0.25rem) + var(--yj-touch) * 0.5rem)', { 'yj-density': '-1', 'yj-touch': '0' })).toBe(24)
    expect(evalCss('calc(8% + 32% * var(--yj-dark))', { 'yj-dark': '1' })).toBeCloseTo(0.4)
    expect(evalCss('var(--missing, 3px)')).toBe(3)
  })

  test('refuses what it can’t read rather than guessing', () => {
    expect(() => evalCss('calc(1px + 2)')).toThrow(/mixed units/)
    expect(() => evalCss('var(--nope)')).toThrow(/no value/)
  })
})
