import { bezierPoint, ease, springAt, springOvershoot } from './curves'
import { easings, springs } from '../../lib/youj/tokens'

test('ease solves the curve for time, matching the parametric point', () => {
  for (const curve of Object.values(easings)) {
    for (const t of [0.1, 0.35, 0.6, 0.9]) {
      const [x, y] = bezierPoint(curve, t)
      expect(ease(curve, x)).toBeCloseTo(y, 4)
    }
    expect(ease(curve, 0)).toBe(0)
    expect(ease(curve, 1)).toBe(1)
  }
})

test('linear easing is the identity', () => {
  expect(ease(easings.linear, 0.37)).toBeCloseTo(0.37, 5)
})

test('only the settle spring overshoots, and it lands', () => {
  expect(springOvershoot(springs.snappy)).toBe(0)
  expect(springOvershoot(springs.smooth)).toBe(0)
  expect(springOvershoot(springs.settle)).toBeGreaterThan(0.02)
  expect(springOvershoot(springs.settle)).toBeLessThan(0.08)
  for (const s of Object.values(springs)) expect(springAt(s, s.visualDuration * 4)).toBeCloseTo(1, 2)
})
