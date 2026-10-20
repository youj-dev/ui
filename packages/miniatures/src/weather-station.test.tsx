import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'
import { MiniatureWeatherStation, weatherStation } from './weather-station'

describeMiniature(MiniatureWeatherStation, weatherStation)

describe('WeatherStation', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('starts by day at 8 km/h from the north-east, with an empty collector', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureWeatherStation, { reducedMotion: 'always' })
    await run(100)
    expect(handle().getSnapshot()).toEqual({ ...weatherStation.initial, pressed: handle().getSnapshot().pressed })
    expect(svg()).not.toHaveClass('night', 'raining', 'draining')
  })

  it('W raises the wind by 2 km/h and Shift W lowers it, down to calm and up to 40', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureWeatherStation, { reducedMotion: 'always' })
    act(() => handle().press('w'))
    await run(100)
    expect(handle().getSnapshot().readout).toBe('10.0 km/h · 0.0 mm')
    expect(handle().getSnapshot().state).toBe('DAY · SOLAR 14 W · NE 057°')
    for (let i = 0; i < 6; i++) act(() => handle().press('shift+w'))
    await run(100)
    expect(handle().getSnapshot().readout).toBe('0.0 km/h · 0.0 mm')
    expect(handle().getSnapshot().state).toBe('DAY · SOLAR 14 W · CALM')
    for (let i = 0; i < 25; i++) act(() => handle().press('w'))
    await run(100)
    expect(handle().getSnapshot().readout).toBe('40.0 km/h · 0.0 mm')
  })

  it('a wind prop sets the wind, snapped to steps of 2 and kept within 0 to 40', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureWeatherStation, { reducedMotion: 'always', wind: 20 })
    await run(100)
    expect(handle().getSnapshot().readout).toBe('20.0 km/h · 0.0 mm')
    rerender(<MiniatureWeatherStation ref={ref} reducedMotion="always" wind={0} />)
    await run(100)
    expect(handle().getSnapshot().readout).toBe('0.0 km/h · 0.0 mm')
    rerender(<MiniatureWeatherStation ref={ref} reducedMotion="always" wind={99} />)
    await run(100)
    expect(handle().getSnapshot().readout).toBe('40.0 km/h · 0.0 mm')
  })

  it('R starts and stops the rain, which fills the collector', async () => {
    const run = useFrames()
    const { handle, svg, inside } = mount(MiniatureWeatherStation, { reducedMotion: 'always' })
    act(() => handle().press('r'))
    await run(100)
    expect(svg()).toHaveClass('raining')
    expect(handle().getSnapshot().state).toMatch(/RAINING$/)
    expect(handle().getSnapshot().readout).toBe('8.0 km/h · 0.5 mm')
    await run(3000)
    expect(parseFloat(handle().getSnapshot().readout.split('· ')[1]!)).toBeGreaterThan(0.5)
    act(() => handle().press('r'))
    await run(100)
    expect(svg()).not.toHaveClass('raining')
    expect(inside.getElementById('rainControl')).toHaveAttribute('aria-pressed', 'false')
  })

  it('Shift R drains the collector', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureWeatherStation, { reducedMotion: 'always' })
    act(() => handle().press('r'))
    await run(2000)
    act(() => handle().press('shift+r'))
    await run(100)
    expect(handle().getSnapshot().readout).toBe('8.0 km/h · 0.0 mm')
    expect(svg()).not.toHaveClass('raining')
  })

  it('D switches to night, on the host too, and back', async () => {
    const run = useFrames()
    const { handle, svg, root } = mount(MiniatureWeatherStation, { reducedMotion: 'always' })
    act(() => handle().press('d'))
    await run(100)
    expect(svg()).toHaveClass('night')
    expect(root()).toHaveAttribute('data-night')
    expect(handle().getSnapshot().state).toMatch(/^NIGHT · BATTERY/)
    act(() => handle().press('d'))
    await run(100)
    expect(svg()).not.toHaveClass('night')
    expect(root()).toHaveAttribute('data-day')
  })

  it('the wind cups and the dial are controls too: Enter on the dial adds wind', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureWeatherStation, { reducedMotion: 'always' })
    const dial = inside.getElementById('dialControl')!
    act(() => dial.focus())
    act(() => void dial.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true, cancelable: true })))
    await run(100)
    expect(handle().getSnapshot().readout).toBe('10.0 km/h · 0.0 mm')
  })
})
