import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureAquarium, aquarium } from './aquarium'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureAquarium, aquarium)

describe('Aquarium', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('starts in daylight, holding 25 degrees with the air pump on and no food', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureAquarium, { reducedMotion: 'always' })
    await run(100)
    expect(handle().getSnapshot()).toMatchObject({
      readout: '25.0 °C · DAY',
      state: 'SET 25.0 °C · HOLDING · AIR ON',
      pressed: { l: false, b: true },
    })
    expect(svg()).toHaveClass('lit-day')
    expect(svg()).not.toHaveClass('lit-night', 'heating')
    expect(inside.querySelector('.lcd-t')).toHaveTextContent('25.0 °C')
    expect(inside.querySelector('[aria-label="Light: day or night (L)"]')).toHaveAttribute('aria-pressed', 'false')
    expect([...inside.querySelectorAll('.flake')].every((n) => n.getAttribute('rx') === '0')).toBe(true)
  })

  it('F drops nine visible flakes into the water and reports each feeding', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureAquarium, { reducedMotion: 'always' })
    await run(100)
    const flakes = () => [...inside.querySelectorAll('.flake')].filter((n) => Number(n.getAttribute('rx')) > 0)
    act(() => handle().press('f'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('SET 25.0 °C · HOLDING · AIR ON · 9 FLAKES')
    expect(flakes()).toHaveLength(9)
    expect(inside.querySelector('[role=status]')).toHaveTextContent('9 flakes dropped in.')
    act(() => handle().press('f'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('SET 25.0 °C · HOLDING · AIR ON · 18 FLAKES')
    expect(flakes()).toHaveLength(18)
  })

  it('L switches to blue moonlight and back to daylight', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureAquarium, { reducedMotion: 'always' })
    await run(100)
    const light = inside.querySelector('[aria-label="Light: day or night (L)"]')!
    act(() => handle().press('l'))
    await run(100)
    expect(handle().getSnapshot().readout).toBe('25.0 °C · NIGHT')
    expect(handle().getSnapshot().pressed.l).toBe(true)
    expect(svg()).toHaveClass('lit-night')
    expect(svg()).not.toHaveClass('lit-day')
    expect(light).toHaveAttribute('aria-pressed', 'true')
    expect(inside.querySelector<SVGElement>('.glow-moon')!.style.opacity).toBe('0.5')
    expect(inside.querySelector<SVGElement>('.glow-day')!.style.opacity).toBe('0')
    expect([...inside.querySelectorAll<SVGElement>('.night')].every((n) => Number(n.style.opacity) > 0)).toBe(true)
    act(() => handle().press('l'))
    await run(100)
    expect(handle().getSnapshot().readout).toBe('25.0 °C · DAY')
    expect(handle().getSnapshot().pressed.l).toBe(false)
    expect(svg()).toHaveClass('lit-day')
    expect(svg()).not.toHaveClass('lit-night')
    expect(light).toHaveAttribute('aria-pressed', 'false')
    expect(inside.querySelector<SVGElement>('.glow-moon')!.style.opacity).toBe('0')
    expect(inside.querySelector<SVGElement>('.glow-day')!.style.opacity).toBe('0.55')
    expect([...inside.querySelectorAll<SVGElement>('.night')].every((n) => n.style.opacity === '0')).toBe(true)
  })

  it('B stops new airstone bubbles, lets the existing ones rise, and restarts the pump', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureAquarium, { reducedMotion: 'never' })
    // The airstone and filter have separate bubble groups; B controls only the airstone.
    const airstone = inside.querySelector('.bub')!.parentElement!
    const bubbles = () => [...airstone.querySelectorAll('.bub')].filter((n) => Number(n.getAttribute('r')) > 0)
    await run(400)
    expect(bubbles().length).toBeGreaterThan(0)
    act(() => handle().press('b'))
    await run(100)
    expect(handle().getSnapshot().pressed.b).toBe(false)
    expect(handle().getSnapshot().state).toBe('SET 25.0 °C · HOLDING · AIR OFF')
    expect(bubbles().length).toBeGreaterThan(0)
    await run(4000)
    expect(bubbles()).toHaveLength(0)
    act(() => handle().press('b'))
    await run(400)
    expect(handle().getSnapshot().pressed.b).toBe(true)
    expect(handle().getSnapshot().state).toBe('SET 25.0 °C · HOLDING · AIR ON')
    expect(bubbles().length).toBeGreaterThan(0)
  })

  it('ArrowUp raises the heater setting by half a degree, lights the heater and warms the tank', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureAquarium, { reducedMotion: 'always' })
    await run(100)
    act(() => handle().press('ArrowUp'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('SET 25.5 °C · HEATING · AIR ON')
    expect(svg()).toHaveClass('heating')
    await run(5000)
    expect(parseFloat(handle().getSnapshot().readout)).toBeGreaterThan(25)
    expect(inside.querySelector('.lcd-t')!.textContent).toBe(handle().getSnapshot().readout.split(' · ')[0])
  })

  it('ArrowDown lowers the heater setting by half a degree and lets the tank cool', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureAquarium, { reducedMotion: 'always' })
    await run(100)
    act(() => handle().press('ArrowDown'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('SET 24.5 °C · HOLDING · AIR ON')
    expect(svg()).not.toHaveClass('heating')
    await run(5000)
    expect(parseFloat(handle().getSnapshot().readout)).toBeLessThan(25)
    expect(inside.querySelector('.lcd-t')!.textContent).toBe(handle().getSnapshot().readout.split(' · ')[0])
  })

  it('keeps the heater setting between 22 and 30 degrees', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureAquarium, { reducedMotion: 'always' })
    await run(100)
    act(() => {
      for (let i = 0; i < 12; i++) handle().press('ArrowUp')
    })
    await run(100)
    expect(handle().getSnapshot().state).toBe('SET 30.0 °C · HEATING · AIR ON')
    act(() => {
      for (let i = 0; i < 18; i++) handle().press('ArrowDown')
    })
    await run(100)
    expect(handle().getSnapshot().state).toBe('SET 22.0 °C · HOLDING · AIR ON')
  })
})
