import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureEspresso, espresso } from './espresso'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureEspresso, espresso)

describe('Espresso', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('starts in standby with power and steam off, disabled shot buttons and a partly filled cup', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureEspresso)
    await run(100)
    expect(handle().getSnapshot()).toEqual(espresso.initial)
    expect(svg()).not.toHaveClass('powered', 'brewing', 'steaming')
    expect(inside.getElementById('powerControl')).toHaveAttribute('aria-pressed', 'false')
    expect(inside.getElementById('steamControl')).toHaveAttribute('aria-pressed', 'false')
    for (const id of ['single', 'double']) expect(inside.getElementById(id)).toHaveAttribute('aria-disabled', 'true')
    expect(inside.querySelector('.screen-text')).toHaveTextContent('--')
    expect(inside.querySelector('.crema')!.parentElement).toHaveAttribute('transform', 'translate(27.00 27.00)')
    expect(Number(inside.querySelector('.water')!.getAttribute('y'))).toBeCloseTo(44.68)
  })

  it('O powers it on at nine bar and off again, closing steam and disabling the shot buttons', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureEspresso, { reducedMotion: 'always' })
    act(() => handle().press('o'))
    await run(100)
    expect(handle().getSnapshot().readout).toBe('9.1 bar · 00 s')
    expect(handle().getSnapshot().state).toBe('READY TO BREW')
    expect(svg()).toHaveClass('powered')
    expect(inside.getElementById('powerControl')).toHaveAttribute('aria-pressed', 'true')
    for (const id of ['single', 'double']) expect(inside.getElementById(id)).toHaveAttribute('aria-disabled', 'false')
    act(() => handle().press('s'))
    act(() => handle().press('o'))
    await run(100)
    expect(handle().getSnapshot().readout).toBe('0.0 bar · 00 s')
    expect(handle().getSnapshot().state).toBe('STANDBY')
    expect(svg()).not.toHaveClass('powered')
    expect(svg()).not.toHaveClass('steaming')
    expect(inside.getElementById('powerControl')).toHaveAttribute('aria-pressed', 'false')
    expect(inside.getElementById('steamControl')).toHaveAttribute('aria-pressed', 'false')
    for (const id of ['single', 'double']) expect(inside.getElementById(id)).toHaveAttribute('aria-disabled', 'true')
  })

  it('warms up before settling at nine bar when motion is allowed', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureEspresso, { reducedMotion: 'never' })
    act(() => handle().press('o'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('WARMING')
    expect(svg()).toHaveClass('warming')
    expect(parseFloat(handle().getSnapshot().readout)).toBeLessThan(9)
    await run(2200)
    expect(handle().getSnapshot().readout).toBe('9.1 bar · 00 s')
    expect(handle().getSnapshot().state).toBe('READY TO BREW')
    expect(svg()).not.toHaveClass('warming')
  })

  it.each([
    ['1', 'POWER ON TO BREW'],
    ['2', 'POWER ON TO BREW'],
    ['s', 'POWER ON TO STEAM'],
  ] as const)('%s asks for power while in standby', async (key, state) => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureEspresso, { reducedMotion: 'always' })
    act(() => handle().press(key))
    await run(100)
    expect(handle().getSnapshot().state).toBe(state)
    expect(handle().getSnapshot().readout).toBe('0.0 bar · 00 s')
    expect(svg()).not.toHaveClass('brewing')
    expect(svg()).not.toHaveClass('steaming')
    await run(1800)
    expect(handle().getSnapshot().state).toBe('STANDBY')
  })

  it.each([
    ['1', 'single', '27', 'translate(13.20 13.20)'],
    ['2', 'double', '30', 'translate(7.20 7.20)'],
  ] as const)('%s extracts a shot, fills the cup and uses reservoir water', async (key, id, seconds, cupTransform) => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureEspresso, { reducedMotion: 'always' })
    const water = inside.querySelector('.water')!
    const initialWater = Number(water.getAttribute('y'))
    act(() => handle().press('o'))
    act(() => handle().press(key))
    await run(100)
    expect(handle().getSnapshot().state).toBe('EXTRACTING')
    expect(svg()).toHaveClass('brewing')
    expect(inside.getElementById(id)).toHaveClass('active', 'pressed')
    for (const button of ['single', 'double']) expect(inside.getElementById(button)).toHaveAttribute('aria-disabled', 'true')
    expect(inside.querySelector('.crema')!.parentElement).toHaveAttribute('transform', cupTransform)
    expect(Number(water.getAttribute('y'))).toBeGreaterThan(initialWater)
    await run(4600)
    expect(handle().getSnapshot().readout).toBe(`9.1 bar · ${seconds} s`)
    expect(handle().getSnapshot().state).toBe('READY TO BREW')
    expect(inside.querySelector('.screen-text')).toHaveTextContent(seconds)
    expect(svg()).not.toHaveClass('brewing')
    expect(inside.getElementById(id)).not.toHaveClass('active')
    expect(inside.getElementById(id)).not.toHaveClass('pressed')
    for (const button of ['single', 'double']) expect(inside.getElementById(button)).toHaveAttribute('aria-disabled', 'false')
  })

  it('S opens and closes the steam valve, changing the pressure and the visible steam mode', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureEspresso, { reducedMotion: 'always' })
    act(() => handle().press('o'))
    act(() => handle().press('s'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('STEAM OPEN')
    expect(handle().getSnapshot().readout).toBe('8.8 bar · 00 s')
    expect(svg()).toHaveClass('steaming')
    expect(inside.getElementById('steamControl')).toHaveAttribute('aria-pressed', 'true')
    act(() => handle().press('s'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('READY TO BREW')
    expect(handle().getSnapshot().readout).toBe('9.1 bar · 00 s')
    expect(svg()).not.toHaveClass('steaming')
    expect(inside.getElementById('steamControl')).toHaveAttribute('aria-pressed', 'false')
  })

  it('R refills the reservoir and briefly reports it as full', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureEspresso, { reducedMotion: 'always' })
    act(() => handle().press('r'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('RESERVOIR FULL')
    expect(handle().getSnapshot().readout).toBe('0.0 bar · 00 s')
    expect(inside.querySelector('.water')).toHaveAttribute('y', '36')
    expect(inside.querySelector('.water')).toHaveAttribute('height', '70')
    expect(inside.querySelector('.water-line')).toHaveAttribute('y1', '36')
    expect(inside.querySelector('.water-line')).toHaveAttribute('y2', '36')
    await run(1800)
    expect(handle().getSnapshot().state).toBe('STANDBY')
    expect(inside.querySelector('.water')).toHaveAttribute('y', '36')
  })

  it('C serves a full cup and makes room for another shot', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureEspresso, { reducedMotion: 'always' })
    act(() => handle().press('o'))
    for (let shot = 0; shot < 2; shot++) {
      act(() => handle().press('1'))
      await run(4200)
    }
    expect(handle().getSnapshot().state).toBe('CUP FULL · C TO SERVE')
    expect(inside.getElementById('single')).toHaveAttribute('aria-disabled', 'true')
    act(() => handle().press('2'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('CUP FULL · C TO SERVE')
    expect(inside.getElementById('double')).not.toHaveClass('active')
    act(() => handle().press('c'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('READY TO BREW')
    expect(handle().getSnapshot().readout).toBe('9.1 bar · 27 s')
    expect(inside.querySelector('.crema')!.parentElement).toHaveAttribute('transform', 'translate(30.00 30.00)')
    for (const id of ['single', 'double']) expect(inside.getElementById(id)).toHaveAttribute('aria-disabled', 'false')
  })

  it('C waits for an extracting shot before serving the cup', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureEspresso, { reducedMotion: 'always' })
    act(() => handle().press('o'))
    act(() => handle().press('2'))
    act(() => handle().press('c'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('WAIT FOR THE SHOT')
    expect(svg()).toHaveClass('brewing')
    expect(inside.querySelector('.crema')!.parentElement).toHaveAttribute('transform', 'translate(7.20 7.20)')
    await run(4500)
    expect(handle().getSnapshot().state).toBe('READY TO BREW')
  })
})
