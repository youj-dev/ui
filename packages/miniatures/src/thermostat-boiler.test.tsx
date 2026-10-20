import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureThermostatBoiler, type MiniatureThermostatBoilerKey, thermostatBoiler } from './thermostat-boiler'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureThermostatBoiler, thermostatBoiler)

describe('ThermostatBoiler', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureThermostatBoilerKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureThermostatBoiler, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts at temperature, a little above the setpoint, with the flame off', async () => {
    const { snap, svg } = await play()
    expect(snap()).toEqual(thermostatBoiler.initial)
    expect(svg()).not.toHaveClass('firing')
  })

  it('Up raises the setpoint, so the flame lights', async () => {
    const { snap, svg } = await play(['ArrowUp'])
    expect(snap().readout).toBe('19.2 °C → 19.5 °C')
    expect(snap().state).toBe('HEATING · FLAME ON')
    expect(svg()).toHaveClass('firing')
  })

  it('Down lowers the setpoint', async () => {
    const { snap, svg } = await play(['ArrowDown'])
    expect(snap().readout).toBe('19.2 °C → 18.5 °C')
    expect(svg()).not.toHaveClass('firing')
  })

  it('E sets the eco setpoint and E again returns to the comfort one', async () => {
    const { handle, run, snap } = await play(['e'])
    expect(snap().readout).toBe('19.2 °C → 17.0 °C')
    expect(snap().state).toBe('ECO · AT TEMPERATURE')
    expect(snap().pressed.e).toBe(true)
    act(() => handle().press('e'))
    await run(400)
    expect(snap().readout).toBe('19.2 °C → 19.0 °C')
    expect(snap().pressed.e).toBe(false)
  })

  it('F forces the flame on as a boost', async () => {
    const { snap, svg } = await play(['f'])
    expect(snap().state).toBe('BOOST · FLAME ON')
    expect(snap().pressed.f).toBe(true)
    expect(svg()).toHaveClass('firing')
  })

  it('V opens the bleed valve and pauses the flame', async () => {
    const { snap, svg } = await play(['v'])
    expect(snap().state).toBe('BLEED OPEN · FLAME PAUSED')
    expect(snap().pressed.v).toBe(true)
    expect(svg()).toHaveClass('venting')
  })
})
