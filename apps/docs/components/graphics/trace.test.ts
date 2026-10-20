import { motionPersonalities } from '@youj/core'
import { polyline, spacing, springCurve, TICK_MS, tweenCurve } from './trace'

describe('motion traces', () => {
  it('reads a tween straight from the tokens, from 0 to 1 over its duration', () => {
    const curve = tweenCurve('precise', 'slow', 'enter')
    expect(curve.duration).toBe(motionPersonalities.precise.durations.slow)
    expect(curve.at(0)).toBe(0)
    expect(curve.at(curve.duration)).toBe(1)
    expect(curve.at(curve.duration / 2)).toBeGreaterThan(0.5)
    expect(curve.name).toBe('slow · enter')
  })

  it('follows the theme’s motion personality', () => {
    expect(tweenCurve('calm', 'slow', 'enter').duration).toBe(motionPersonalities.calm.durations.slow)
  })

  it('charts a spring until it has landed, quoting its perceived duration', () => {
    const curve = springCurve('precise', 'smooth')
    expect(curve.token).toBe(360)
    expect(curve.duration).toBeGreaterThan(360)
    expect(curve.duration).toBeLessThan(900)
    expect(curve.at(0)).toBe(0)
    expect(Math.abs(1 - curve.at(curve.duration - 1))).toBeLessThan(0.006)
  })

  it('lets a lively spring overshoot on the way to rest', () => {
    const settle = springCurve('lively', 'settle')
    const peak = Math.max(...spacing(settle, 5))
    expect(peak).toBeGreaterThan(1.05)
  })

  it('spaces ticks at equal times: an ease-out crowds them at the landing', () => {
    const ticks = spacing(tweenCurve('precise', 'slow', 'enter'))
    expect(ticks[0]).toBe(0)
    expect(ticks.at(-1)).toBe(1)
    expect(ticks.length).toBe(Math.ceil(340 / TICK_MS) + 1)
    const first = ticks[1]! - ticks[0]!
    const last = ticks.at(-1)! - ticks.at(-2)!
    expect(first).toBeGreaterThan(last * 5)
  })

  it('draws a polyline as path data', () => {
    expect(
      polyline([
        [0, 0],
        [10, 0],
        [10, 10],
      ]),
    ).toBe('M0.00 0.00 L10.00 0.00 L10.00 10.00')
  })
})
