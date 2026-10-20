import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureDeskFan, deskFan } from './desk-fan'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureDeskFan, deskFan)

describe('DeskFan', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('starts off, centered and level, with stationary blades and no airflow', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureDeskFan, { reducedMotion: 'always' })
    expect(handle().getSnapshot()).toEqual(deskFan.initial)
    await run(200)
    expect(handle().getSnapshot()).toEqual({
      readout: 'OFF · 0 RPM · OSC OFF',
      state: 'STILL · PRESS 1–3 · TILT 0°',
      pressed: { o: false },
    })
    expect(svg()).not.toHaveClass('on')
    expect(inside.querySelector('.blade')!.parentElement).toHaveAttribute('transform', 'rotate(0.00)')
    expect(inside.querySelector('.disc')).toHaveStyle({ opacity: '0' })
    for (const air of inside.querySelectorAll('.air')) expect(air).toHaveStyle({ opacity: '0' })
  })

  // The lab readout uses speed / 3 * 1280, rather than the unused RPM[1–2].
  it.each([
    ['1', 427, '65.00', '0.00'],
    ['2', 853, '25.00', '0.57'],
    ['3', 1280, '-15.00', '1.00'],
  ] as const)('%s selects its speed, turns the knob, lifts the streamers and shows airflow', async (key, rpm, angle, blur) => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureDeskFan, { reducedMotion: 'always' })
    await run(100)
    const streamers = [...inside.querySelectorAll('.rib')].map((rib) => rib.getAttribute('d'))
    act(() => handle().press(key))
    await run(200)
    expect(handle().getSnapshot().readout).toBe(`SPEED ${key} · ${rpm} RPM · OSC OFF`)
    expect(handle().getSnapshot().state).toBe('HOLDING · CENTER · TILT 0°')
    expect(svg()).toHaveClass('on')
    expect(inside.querySelector('[aria-label^="Speed knob"] g[transform^="rotate"]')).toHaveAttribute('transform', `rotate(${angle})`)
    expect(inside.querySelector('.disc')).toHaveStyle({ opacity: blur })
    for (const [i, rib] of [...inside.querySelectorAll('.rib')].entries()) expect(rib.getAttribute('d')).not.toBe(streamers[i])
    for (const air of inside.querySelectorAll<SVGElement>('.air')) expect(Number(air.style.opacity)).toBeGreaterThan(0)
  })

  it('0 switches off and returns the knob, blades and streamers to rest with reduced motion', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureDeskFan, { reducedMotion: 'always' })
    await run(100)
    const streamers = [...inside.querySelectorAll('.rib')].map((rib) => rib.getAttribute('d'))
    act(() => handle().press('3'))
    await run(200)
    act(() => handle().press('0'))
    await run(200)
    expect(handle().getSnapshot().readout).toBe('OFF · 0 RPM · OSC OFF')
    expect(handle().getSnapshot().state).toBe('STILL · PRESS 1–3 · TILT 0°')
    expect(svg()).not.toHaveClass('on')
    expect(inside.querySelector('[aria-label^="Speed knob"] g[transform^="rotate"]')).toHaveAttribute('transform', 'rotate(105.00)')
    expect(inside.querySelector('.disc')).toHaveStyle({ opacity: '0' })
    expect([...inside.querySelectorAll('.rib')].map((rib) => rib.getAttribute('d'))).toEqual(streamers)
    for (const air of inside.querySelectorAll('.air')) expect(air).toHaveStyle({ opacity: '0' })
  })

  it('spins up and coasts down when motion is allowed', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureDeskFan, { reducedMotion: 'never' })
    await run(100)
    const blades = inside.querySelector('.blade')!.parentElement!
    act(() => handle().press('3'))
    await run(300)
    expect(handle().getSnapshot().state).toBe('SPINNING UP · TILT 0°')
    expect(blades.getAttribute('transform')).not.toBe('rotate(0.00)')
    await run(3000)
    expect(handle().getSnapshot().state).toBe('HOLDING · CENTER · TILT 0°')
    act(() => handle().press('0'))
    await run(300)
    expect(svg()).not.toHaveClass('on')
    expect(handle().getSnapshot().state).toBe('COASTING DOWN')
    expect(Number(handle().getSnapshot().readout.match(/· (\d+) RPM/)![1])).toBeGreaterThan(0)
    const coasting = blades.getAttribute('transform')
    await run(300)
    expect(blades.getAttribute('transform')).not.toBe(coasting)
    await run(10000)
    expect(handle().getSnapshot().state).toBe('STILL · PRESS 1–3 · TILT 0°')
  })

  it('O pulls the oscillation knob and toggles the snapshot, holding the head with reduced motion', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDeskFan, { reducedMotion: 'always' })
    act(() => handle().press('3'))
    await run(200)
    const knob = inside.querySelector('[aria-label^="Oscillation knob"]')!
    const top = knob.querySelector('g')!
    const lowered = top.getAttribute('transform')
    act(() => handle().press('o'))
    await run(200)
    expect(handle().getSnapshot()).toEqual({ readout: 'SPEED 3 · 1280 RPM · OSC ON', state: 'SWEEPING · CENTER · TILT 0°', pressed: { o: true } })
    expect(knob).toHaveAttribute('aria-pressed', 'true')
    expect(top.getAttribute('transform')).not.toBe(lowered)
    const raised = top.getAttribute('transform')
    await run(1000)
    expect(top).toHaveAttribute('transform', raised)
    act(() => handle().press('o'))
    await run(200)
    expect(handle().getSnapshot()).toEqual({ readout: 'SPEED 3 · 1280 RPM · OSC OFF', state: 'HOLDING · CENTER · TILT 0°', pressed: { o: false } })
    expect(knob).toHaveAttribute('aria-pressed', 'false')
    expect(top).toHaveAttribute('transform', lowered)
  })

  it('oscillates while running and holds its current angle when O switches it off', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDeskFan, { reducedMotion: 'never' })
    act(() => handle().press('3'))
    act(() => handle().press('o'))
    await run(3500)
    expect(handle().getSnapshot().state).toMatch(/^SWEEPING · \d+° LEFT · TILT 0°$/)
    const head = inside.querySelector('.blade')!.parentElement!.parentElement!
    const angle = head.getAttribute('transform')
    act(() => handle().press('o'))
    await run(200)
    expect(handle().getSnapshot().readout).toMatch(/^SPEED 3 · \d+ RPM · OSC OFF$/)
    expect(handle().getSnapshot().state).toMatch(/^HOLDING · \d+° LEFT · TILT 0°$/)
    await run(1000)
    expect(head).toHaveAttribute('transform', angle)
  })

  it('the arrows tilt the head through -12°, 0° and 10°, stopping at each limit', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDeskFan, { reducedMotion: 'always' })
    await run(100)
    const head = inside.querySelector('.blade')!.parentElement!.parentElement!
    const level = head.getAttribute('transform')
    for (const [key, tilt] of [['ArrowUp', 10], ['ArrowUp', 10], ['ArrowDown', 0], ['ArrowDown', -12], ['ArrowDown', -12], ['ArrowUp', 0]] as const) {
      act(() => handle().press(key))
      await run(200)
      expect(handle().getSnapshot().readout).toBe('OFF · 0 RPM · OSC OFF')
      expect(handle().getSnapshot().state).toBe(`STILL · PRESS 1–3 · TILT ${tilt}°`)
      if (tilt === 0) expect(head).toHaveAttribute('transform', level)
      else expect(head.getAttribute('transform')).not.toBe(level)
    }
  })
})
