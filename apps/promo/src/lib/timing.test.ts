import { describe, expect, it } from 'vitest'
import { durations, staggers } from '@youj/core'
import { dur, during, frames, spring, stagger, tween } from './timing'

describe('tokens in frames', () => {
  it('converts the motion tokens at 60fps', () => {
    expect(frames(1000)).toBe(60)
    expect(dur('base')).toBeCloseTo((durations.base / 1000) * 60)
    expect(stagger('loose')).toBeCloseTo((staggers.loose / 1000) * 60)
  })
})

describe('tween', () => {
  it('holds before it starts and lands exactly at 1 after its duration', () => {
    expect(tween(9, 10, 'base')).toBe(0)
    expect(tween(10 + dur('base'), 10, 'base')).toBe(1)
    expect(tween(500, 10, 'base')).toBe(1)
  })

  it('follows its easing token: enter decelerates hard, exit accelerates away', () => {
    expect(tween(5, 0, 20, 'enter')).toBeGreaterThan(0.5)
    expect(tween(5, 0, 20, 'exit')).toBeLessThan(0.1)
  })
})

describe('spring', () => {
  const sample = (token: 'snappy' | 'smooth' | 'settle') => Array.from({ length: 120 }, (_, f) => spring(f, 0, token))

  it('overshoots only on settle, the one bounce the art direction allows', () => {
    expect(Math.max(...sample('settle'))).toBeGreaterThan(1.02)
    expect(Math.max(...sample('smooth'))).toBeLessThanOrEqual(1)
    expect(Math.max(...sample('snappy'))).toBeLessThanOrEqual(1)
  })

  it('comes to rest at 1', () => {
    for (const token of ['snappy', 'smooth', 'settle'] as const) expect(sample(token).at(-1)).toBe(1)
  })
})

describe('during', () => {
  it('is 1 inside the window and eases to 0 at both edges', () => {
    expect(during(50, 20, 80, 10)).toBe(1)
    expect(during(20, 20, 80, 10)).toBe(0)
    expect(during(80, 20, 80, 10)).toBe(0)
  })
})
