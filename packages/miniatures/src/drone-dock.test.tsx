import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureDroneDock, type MiniatureDroneDockKey, droneDock } from './drone-dock'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureDroneDock, droneDock)

describe('DroneDock', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  // Each prop's blades sit inside its projected plane, inside the moving drone group.
  const drone = (inside: ShadowRoot) => inside.querySelector('.prop')!.parentElement!.parentElement!.parentElement!
  const rails = (inside: ShadowRoot) => [...inside.querySelectorAll<SVGElement>('.railg')]

  it('starts docked and charging at 64%, with lit rails and stopped rotors', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDroneDock)
    expect(handle().getSnapshot()).toEqual(droneDock.initial)
    await run(100)
    expect(handle().getSnapshot().state).toBe('CHARGING')
    expect(drone(inside)).toHaveAttribute('transform', 'translate(0.00 0.00)')
    expect(inside.querySelector('[aria-label="Charge the drone (C)"]')).toHaveAttribute('aria-pressed', 'true')
    expect(inside.querySelector('[aria-label="T/O: take off or land (T)"]')).toHaveAttribute('aria-pressed', 'false')
    for (const rail of rails(inside)) expect(Number(rail.style.opacity)).toBeGreaterThan(0)
    for (const blur of inside.querySelectorAll<SVGElement>('.blur')) expect(Number(blur.style.opacity)).toBe(0)
  })

  it('T takes off to one metre, retracts the bars and spins the rotors; T lands and resumes charging', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDroneDock, { reducedMotion: 'always' })
    await run(50)
    // The bars are separate top-level groups translated onto the skids while docked.
    const leftBar = inside.querySelector('[transform="translate(55.43 32.00)"]')!
    const rightBar = inside.querySelector('[transform="translate(-51.96 -30.00)"]')!
    act(() => handle().press('t'))
    await run(50)
    expect(handle().getSnapshot()).toEqual({ readout: '1.0 m · 64%', state: 'HOVERING · +0, +0', pressed: { t: true, c: false } })
    expect(drone(inside)).toHaveAttribute('transform', 'translate(0.00 -80.00)')
    expect(leftBar).toHaveAttribute('transform', 'translate(0.00 0.00)')
    expect(rightBar).toHaveAttribute('transform', 'translate(0.00 0.00)')
    expect(inside.querySelector('[aria-label="T/O: take off or land (T)"]')).toHaveAttribute('aria-pressed', 'true')
    for (const rail of rails(inside)) expect(rail.style.opacity).toBe('0')
    for (const blur of inside.querySelectorAll<SVGElement>('.blur')) expect(blur.style.opacity).toBe('0.22')

    act(() => handle().press('ArrowRight'))
    await run(50)
    act(() => handle().press('t'))
    await run(50)
    expect(handle().getSnapshot().state).toBe('CHARGING')
    expect(handle().getSnapshot().readout).toMatch(/^0\.0 m · \d+%$/)
    expect(handle().getSnapshot().pressed).toEqual({ t: false, c: true })
    expect(drone(inside)).toHaveAttribute('transform', 'translate(0.00 0.00)')
    expect(leftBar).toHaveAttribute('transform', 'translate(55.43 32.00)')
    expect(rightBar).toHaveAttribute('transform', 'translate(-51.96 -30.00)')
    for (const rail of rails(inside)) expect(rail.style.opacity).toBe('0.8')
  })

  const directions = [
    ['ArrowUp', '-8, -8', 'translate(0.00 -88.00)', 'translate(50 41.6)'],
    ['ArrowDown', '+8, +8', 'translate(0.00 -72.00)', 'translate(50 46.4)'],
    ['ArrowLeft', '-8, +8', 'translate(-13.86 -80.00)', 'translate(47.6 44)'],
    ['ArrowRight', '+8, -8', 'translate(13.86 -80.00)', 'translate(52.4 44)'],
  ] as const satisfies readonly (readonly [MiniatureDroneDockKey, string, string, string])[]

  it.each(directions)('%s nudges the hovering drone and the controller stick', async (key, offset, transform, stickTransform) => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDroneDock, { reducedMotion: 'always' })
    const stick = inside.querySelector('[transform="translate(50 44)"]')!
    act(() => handle().press('t'))
    act(() => handle().press(key))
    await run(50)
    expect(handle().getSnapshot().state).toBe(`HOVERING · ${offset}`)
    expect(handle().getSnapshot().readout).toBe('1.0 m · 64%')
    expect(drone(inside)).toHaveAttribute('transform', transform)
    expect(stick).toHaveAttribute('transform', stickTransform)
    await run(300)
    expect(stick).toHaveAttribute('transform', 'translate(50 44)')
    expect(drone(inside)).toHaveAttribute('transform', transform)
  })

  it.each(directions)('%s while docked asks for take-off and keeps the drone on the pad', async (key) => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDroneDock, { reducedMotion: 'always' })
    act(() => handle().press(key))
    await run(50)
    expect(handle().getSnapshot().state).toBe('TAKE OFF · T')
    expect(handle().getSnapshot().pressed).toEqual({ t: false, c: true })
    expect(drone(inside)).toHaveAttribute('transform', 'translate(0.00 0.00)')
    await run(1800)
    expect(handle().getSnapshot().state).toBe('CHARGING')
  })

  it('C pauses charging and extinguishes the rails; C resumes charging and fills the battery', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDroneDock, { reducedMotion: 'always' })
    act(() => handle().press('c'))
    await run(100)
    expect(handle().getSnapshot()).toEqual({ readout: '0.0 m · 64%', state: 'DOCKED', pressed: { t: false, c: false } })
    expect(inside.querySelector('[aria-label="Charge the drone (C)"]')).toHaveAttribute('aria-pressed', 'false')
    for (const rail of rails(inside)) expect(rail.style.opacity).toBe('0')
    await run(1000)
    expect(handle().getSnapshot().readout).toBe('0.0 m · 64%')

    act(() => handle().press('c'))
    await run(1000)
    expect(handle().getSnapshot().state).toBe('CHARGING')
    expect(handle().getSnapshot().pressed.c).toBe(true)
    expect(Number(handle().getSnapshot().readout.match(/(\d+)%$/)![1])).toBeGreaterThan(64)
    for (const rail of rails(inside)) expect(rail.style.opacity).toBe('0.8')
  })

  it('C while airborne returns the drone to the pad and charges it', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDroneDock, { reducedMotion: 'always' })
    act(() => handle().press('t'))
    act(() => handle().press('ArrowUp'))
    await run(50)
    act(() => handle().press('c'))
    await run(50)
    expect(handle().getSnapshot().state).toBe('CHARGING')
    expect(handle().getSnapshot().readout).toMatch(/^0\.0 m · \d+%$/)
    expect(handle().getSnapshot().pressed).toEqual({ t: false, c: true })
    expect(drone(inside)).toHaveAttribute('transform', 'translate(0.00 0.00)')
    for (const rail of rails(inside)) expect(rail.style.opacity).toBe('0.8')
  })

  it('stops charging at 100%; C reports a full battery without restarting it', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDroneDock, { reducedMotion: 'always' })
    await run(7500)
    expect(handle().getSnapshot()).toEqual({ readout: '0.0 m · 100%', state: 'CHARGED', pressed: { t: false, c: false } })
    for (const rail of rails(inside)) expect(rail.style.opacity).toBe('0')
    act(() => handle().press('c'))
    await run(50)
    expect(handle().getSnapshot().state).toBe('BATTERY FULL')
    expect(handle().getSnapshot().pressed.c).toBe(false)
    await run(2000)
    expect(handle().getSnapshot().state).toBe('CHARGED')
  })

  it('with motion allowed, T takes off and lands through the flight phases', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureDroneDock, { reducedMotion: 'never' })
    act(() => handle().press('t'))
    expect(handle().getSnapshot().state).toBe('BARS OPEN · +0, +0')
    await run(600)
    expect(handle().getSnapshot().state).toBe('SPINNING UP · +0, +0')
    await run(1000)
    expect(handle().getSnapshot().state).toBe('TAKING OFF · +0, +0')
    await run(1700)
    expect(handle().getSnapshot().state).toBe('HOVERING · +0, +0')
    expect(handle().getSnapshot().readout).toMatch(/^1\.0 m · /)

    act(() => handle().press('t'))
    expect(handle().getSnapshot().state).toBe('RETURNING')
    await run(900)
    expect(handle().getSnapshot().state).toBe('LANDING')
    await run(1500)
    expect(handle().getSnapshot().state).toBe('TOUCHDOWN')
    await run(700)
    expect(handle().getSnapshot().state).toBe('CENTERING')
    await run(800)
    expect(handle().getSnapshot().state).toBe('CHARGING')
    expect(handle().getSnapshot().pressed).toEqual({ t: false, c: true })
    expect(handle().getSnapshot().readout).toMatch(/^0\.0 m · /)
  })
})
