import { describe, expect, it } from 'vitest'
import { motionPersonalities } from '@youj/core'
import { mixTuning, paletteVars, tuningOf } from './palette'

describe('tunings', () => {
  it('reads a preset off the library: its palette in the scheme shown, its motion, radius and density', () => {
    const terminal = tuningOf('terminal', 'light')
    expect(terminal.motion).toBe(motionPersonalities.precise)
    expect(terminal.radius).toBe(0)
    expect(terminal.density).toBe(-1)
    // Terminal in light: a pale canvas under dark ink.
    expect(terminal.palette.canvas[0]).toBeGreaterThan(0.9)
    expect(terminal.palette.fg[0]).toBeLessThan(0.3)
  })

  it('is exactly each end at 0 and 1, and in between at every step', () => {
    const graphite = tuningOf('graphite', 'dark')
    const terminal = tuningOf('terminal', 'light')
    expect(mixTuning(graphite, terminal, 0)).toBe(graphite)
    expect(mixTuning(graphite, terminal, 1)).toBe(terminal)
    const half = mixTuning(graphite, terminal, 0.5)
    const [darkL] = graphite.palette.canvas
    const [lightL] = terminal.palette.canvas
    expect(half.palette.canvas[0]).toBeGreaterThan(darkL)
    expect(half.palette.canvas[0]).toBeLessThan(lightL)
    expect(half.motion.durations.base).toBe((graphite.motion.durations.base + terminal.motion.durations.base) / 2)
    expect(half.radius).toBe((graphite.radius + terminal.radius) / 2)
  })

  it('writes the palette as the --color-* tokens surfaces paint with', () => {
    const vars = paletteVars(tuningOf('graphite', 'dark').palette) as Record<string, string>
    expect(vars['--color-canvas']).toMatch(/^oklch\(/)
    expect(vars['--color-accent-contrast']).toMatch(/^oklch\(/)
    expect(Object.keys(vars)).not.toContain('--color-input')
  })
})
