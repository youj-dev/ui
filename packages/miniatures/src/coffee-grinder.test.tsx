import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureCoffeeGrinder, coffeeGrinder } from './coffee-grinder'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureCoffeeGrinder, coffeeGrinder)

describe('CoffeeGrinder', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('starts ready at setting 5, with 180 grams in the hopper and an empty cup', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureCoffeeGrinder, { reducedMotion: 'always' })
    await run(100)
    expect(handle().getSnapshot()).toEqual({ readout: '05 / 12 · 0.0 g', state: 'READY · 18 G DOSE', pressed: {} })
    expect(svg()).toHaveClass('ready')
    expect(svg()).not.toHaveClass('grinding', 'dosing', 'lit')
    expect(inside.getElementById('refillControl')).toHaveAttribute('aria-label', 'Refill hopper. 180 of 220 grams remaining.')
    expect(inside.getElementById('cupControl')).toHaveAttribute('aria-label', 'Empty catch cup. 0.0 grams collected.')
    expect(inside.getElementById('doseControl')).toHaveAttribute('aria-disabled', 'false')
    expect(inside.querySelector('.coffee')!.parentElement).toHaveAttribute('opacity', '0')
    await run(1000)
    expect(handle().getSnapshot().readout).toBe('05 / 12 · 0.0 g')
  })

  it('Space grinds into the lit cup and Space again pauses with the grounds retained', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureCoffeeGrinder, { reducedMotion: 'always' })
    await run(100)
    act(() => handle().press('space'))
    await run(1000)
    expect(handle().getSnapshot().state).toBe('GRINDING · SPACE TO STOP')
    expect(handle().getSnapshot().readout).toMatch(/^05 \/ 12 · 4\.\d g$/)
    expect(svg()).toHaveClass('grinding', 'lit')
    expect(svg()).not.toHaveClass('dosing')
    expect(inside.getElementById('grindControl')).toHaveAttribute('aria-pressed', 'true')
    expect(inside.getElementById('refillControl')!.getAttribute('aria-label')).not.toContain('180 of 220')
    expect(inside.querySelector('.coffee')!.parentElement).toHaveAttribute('opacity', '1')

    act(() => handle().press(' '))
    await run(50)
    const paused = handle().getSnapshot().readout
    expect(handle().getSnapshot().state).toBe('GRIND PAUSED')
    expect(svg()).not.toHaveClass('grinding', 'lit')
    expect(inside.getElementById('grindControl')).toHaveAttribute('aria-pressed', 'false')
    await run(2000)
    expect(handle().getSnapshot().readout).toBe(paused)
    expect(handle().getSnapshot().state).toBe('READY · 18 G DOSE')
    act(() => handle().press(' '))
    await run(1000)
    expect(handle().getSnapshot().readout).not.toBe(paused)
    expect(handle().getSnapshot().state).toBe('GRINDING · SPACE TO STOP')
  })

  it('ArrowUp coarsens the grind and ArrowDown makes it finer, turning the dial and collar', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCoffeeGrinder, { reducedMotion: 'always' })
    const dial = inside.querySelector('.running-mark')!.parentElement!
    const originalDial = dial.getAttribute('transform')
    const collar = inside.querySelector('g[transform="rotate(36)"]')!
    const originalCollar = collar.getAttribute('transform')

    act(() => handle().press('ArrowUp'))
    await run(50)
    expect(handle().getSnapshot().readout).toBe('06 / 12 · 0.0 g')
    expect(handle().getSnapshot().state).toBe('GRIND MEDIUM · 530 µM')
    expect(inside.getElementById('coarserControl')).toHaveAttribute('aria-label', 'Coarser grind. Setting 6 of 12. Arrow up.')
    expect(dial.getAttribute('transform')).not.toBe(originalDial)
    expect(collar.getAttribute('transform')).not.toBe(originalCollar)

    act(() => handle().press('ArrowDown'))
    await run(50)
    expect(handle().getSnapshot().readout).toBe('05 / 12 · 0.0 g')
    expect(handle().getSnapshot().state).toBe('GRIND MEDIUM · 475 µM')
    expect(dial).toHaveAttribute('transform', originalDial!)
    expect(collar).toHaveAttribute('transform', originalCollar!)
    act(() => handle().press('ArrowDown'))
    await run(50)
    expect(handle().getSnapshot().readout).toBe('04 / 12 · 0.0 g')
    expect(handle().getSnapshot().state).toBe('GRIND FINE · 420 µM')
    expect(inside.getElementById('finerControl')).toHaveAttribute('aria-label', 'Finer grind. Setting 4 of 12. Arrow down.')
  })

  it.each([
    { key: 'ArrowDown', control: 'finerControl', setting: '01', state: 'FINE LIMIT · 01' },
    { key: 'ArrowUp', control: 'coarserControl', setting: '12', state: 'COARSE LIMIT · 12' },
  ] as const)('$key stops at the grind limit and disables its control', async ({ key, control, setting, state }) => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureCoffeeGrinder, { reducedMotion: 'always' })
    act(() => {
      for (let i = 0; i < 12; i++) handle().press(key)
    })
    await run(50)
    expect(handle().getSnapshot().readout).toBe(`${setting} / 12 · 0.0 g`)
    expect(handle().getSnapshot().state).toBe(state)
    expect(inside.getElementById(control)).toHaveAttribute('aria-disabled', 'true')
    act(() => handle().press(key === 'ArrowUp' ? 'ArrowDown' : 'ArrowUp'))
    await run(50)
    expect(inside.getElementById(control)).toHaveAttribute('aria-disabled', 'false')
    expect(handle().getSnapshot().readout).toBe(`${key === 'ArrowUp' ? '11' : '02'} / 12 · 0.0 g`)
  })

  it('D grinds one 18 gram dose, stops automatically, and refuses a third dose into the same cup', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureCoffeeGrinder, { reducedMotion: 'always' })
    const dose = inside.getElementById('doseControl')!
    await run(100)
    act(() => handle().press('d'))
    await run(1000)
    expect(handle().getSnapshot().state).toMatch(/^DOSING · 4\.\d \/ 18 G$/)
    expect(svg()).toHaveClass('grinding', 'dosing', 'lit')
    expect(dose).toHaveAttribute('aria-pressed', 'true')
    expect(dose).toHaveAttribute('aria-disabled', 'true')
    act(() => handle().press('d'))
    await run(3200)
    expect(handle().getSnapshot().readout).toBe('05 / 12 · 18.0 g')
    expect(handle().getSnapshot().state).toBe('DOSE COMPLETE · 18.0 G')
    expect(svg()).not.toHaveClass('grinding', 'dosing', 'lit')
    expect(dose).toHaveAttribute('aria-pressed', 'false')
    expect(dose).toHaveAttribute('aria-disabled', 'false')
    expect(inside.getElementById('refillControl')).toHaveAttribute('aria-label', 'Refill hopper. 162 of 220 grams remaining.')
    expect(inside.getElementById('cupControl')).toHaveAttribute('aria-label', 'Empty catch cup. 18.0 grams collected.')

    act(() => handle().press('d'))
    await run(4200)
    expect(handle().getSnapshot().readout).toBe('05 / 12 · 36.0 g')
    expect(handle().getSnapshot().state).toBe('DOSE COMPLETE · 18.0 G')
    expect(dose).toHaveAttribute('aria-disabled', 'true')
    act(() => handle().press('d'))
    await run(50)
    expect(handle().getSnapshot().state).toBe('EMPTY CUP BEFORE DOSING')
    expect(handle().getSnapshot().readout).toBe('05 / 12 · 36.0 g')
    expect(svg()).not.toHaveClass('grinding', 'dosing')
  })

  it('continuous grinding stops at a full 40 gram cup and clicking the cup empties it', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureCoffeeGrinder, { reducedMotion: 'always' })
    await run(100)
    act(() => handle().press(' '))
    await run(9000)
    expect(handle().getSnapshot().readout).toBe('05 / 12 · 40.0 g')
    expect(handle().getSnapshot().state).toBe('CUP FULL · CLICK TO EMPTY')
    expect(svg()).not.toHaveClass('grinding', 'ready')
    act(() => handle().press(' '))
    expect(handle().getSnapshot().state).toBe('EMPTY CUP BEFORE DOSING')

    act(() => inside.getElementById('cupControl')!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(50)
    expect(handle().getSnapshot().readout).toBe('05 / 12 · 0.0 g')
    expect(handle().getSnapshot().state).toBe('CUP EMPTIED · 0.0 G')
    expect(inside.querySelector('.coffee')!.parentElement).toHaveAttribute('opacity', '0')
    act(() => handle().press('d'))
    expect(handle().getSnapshot().state).toBe('WAIT FOR CUP / LID')
    await run(800)
    expect(inside.getElementById('doseControl')).toHaveAttribute('aria-disabled', 'false')
    act(() => handle().press('d'))
    await run(100)
    expect(handle().getSnapshot().state).toMatch(/^DOSING · /)
  })

  it('clicking the lid stops grinding and refills the hopper to 220 grams', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureCoffeeGrinder, { reducedMotion: 'always' })
    await run(100)
    act(() => handle().press(' '))
    await run(1000)
    const collected = handle().getSnapshot().readout
    act(() => inside.getElementById('refillControl')!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(50)
    expect(handle().getSnapshot().state).toBe('HOPPER FULL · 220 G')
    expect(handle().getSnapshot().readout).toBe(collected)
    expect(inside.getElementById('refillControl')).toHaveAttribute('aria-label', 'Refill hopper. 220 of 220 grams remaining.')
    expect(svg()).not.toHaveClass('grinding')
    act(() => handle().press(' '))
    expect(handle().getSnapshot().state).toBe('WAIT FOR CUP / LID')
    await run(1000)
    act(() => handle().press(' '))
    await run(100)
    expect(handle().getSnapshot().state).toBe('GRINDING · SPACE TO STOP')
  })
})
