import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureLetterpress, letterpress } from './letterpress'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureLetterpress, letterpress)

describe('Letterpress', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('starts with PRESS ON locked, a sheet fed and three prints in the tray', async () => {
    const run = useFrames()
    const { handle, svg, inside } = mount(MiniatureLetterpress)
    await run(100)
    expect(handle().getSnapshot()).toEqual(letterpress.initial)
    expect(svg()).toHaveClass('locked', 'inked', 'rolled', 'fed')
    expect([...inside.querySelectorAll('.glyph')].map((g) => g.textContent).join('')).toBe('PRESSON')
    expect([...inside.querySelectorAll('.print')].map((g) => g.textContent)).toEqual(['PRESS ON', 'PRESS ON', 'PRESS ON'])
  })

  it.each(letterpress.keys[0].keys)('%s sets a sort, including I, P and N while composing', async (key) => {
    const run = useFrames()
    const { handle, svg, inside } = mount(MiniatureLetterpress, { reducedMotion: 'always' })
    // The first letter unlocks the form and clears its previous line.
    act(() => handle().press('a'))
    await run(50)
    expect(handle().getSnapshot().readout).toBe('SET 1 · INK LOW · 3 PRINTS')
    expect(svg()).not.toHaveClass('locked')
    act(() => handle().press(key))
    await run(50)
    expect(handle().getSnapshot().readout).toBe('SET 2 · INK LOW · 3 PRINTS')
    expect(handle().getSnapshot().state).toBe('COMPOSING · ⏎ LOCKS FORM')
    expect([...inside.querySelectorAll('.glyph')].map((g) => g.textContent).join('')).toBe(`A${key.toUpperCase()}`)
  })

  it('Space adds a blank sort and the line stops at twelve sorts', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureLetterpress, { reducedMotion: 'always' })
    act(() => handle().press('a'))
    act(() => handle().press('space'))
    await run(50)
    expect(handle().getSnapshot().readout).toBe('SET 2 · INK LOW · 3 PRINTS')
    expect(inside.querySelectorAll('.sort')).toHaveLength(2)
    expect(inside.querySelectorAll('.glyph')).toHaveLength(1)
    act(() => {
      for (let i = 0; i < 11; i++) handle().press('b')
    })
    expect(handle().getSnapshot().readout).toBe('SET 12 · INK LOW · 3 PRINTS')
    expect(handle().getSnapshot().state).toBe('LINE FULL · 12 SORTS')
    expect(inside.querySelectorAll('.sort')).toHaveLength(12)
  })

  it('Backspace unlocks the existing form and removes its last sort', async () => {
    const run = useFrames()
    const { handle, svg, inside } = mount(MiniatureLetterpress, { reducedMotion: 'always' })
    act(() => handle().press('Backspace'))
    await run(50)
    expect(handle().getSnapshot().readout).toBe('SET 7 · INK LOW · 3 PRINTS')
    expect(handle().getSnapshot().state).toBe('COMPOSING · ⏎ LOCKS FORM')
    expect(svg()).not.toHaveClass('locked')
    expect([...inside.querySelectorAll('.glyph')].map((g) => g.textContent).join('')).toBe('PRESSO')
  })

  it('Enter locks the composed form and reports an already locked form', () => {
    const { handle, svg } = mount(MiniatureLetterpress, { reducedMotion: 'always' })
    act(() => handle().press('a'))
    act(() => handle().press('Enter'))
    expect(handle().getSnapshot().state).toBe('READY TO PULL')
    expect(svg()).toHaveClass('locked')
    act(() => handle().press('Enter'))
    expect(handle().getSnapshot().state).toBe('FORM LOCKED · I INK · P PULL')
  })

  it('an empty form cannot be locked', async () => {
    const run = useFrames()
    const { handle, svg, inside } = mount(MiniatureLetterpress, { reducedMotion: 'always' })
    act(() => handle().press('a'))
    act(() => handle().press('Backspace'))
    await run(50)
    expect(handle().getSnapshot().readout).toBe('SET 0 · INK LOW · 3 PRINTS')
    act(() => handle().press('Enter'))
    expect(handle().getSnapshot().state).toBe('SET TYPE FIRST')
    expect(svg()).not.toHaveClass('locked')
    expect(inside.querySelectorAll('.sort')).toHaveLength(0)
  })

  it('I inks the locked form and turns the ink disc', () => {
    const { handle, inside } = mount(MiniatureLetterpress, { reducedMotion: 'always' })
    const spin = inside.querySelector('.film')!.parentElement!
    expect(spin).toHaveAttribute('transform', 'rotate(0)')
    act(() => handle().press('i'))
    expect(handle().getSnapshot().readout).toBe('SET 8 · INKED · 3 PRINTS')
    expect(handle().getSnapshot().state).toBe('READY TO PULL')
    expect(spin).toHaveAttribute('transform', 'rotate(30.0)')
  })

  it('P pulls a print, consumes the sheet and lowers the ink', () => {
    const { handle, svg, inside } = mount(MiniatureLetterpress, { reducedMotion: 'always' })
    act(() => handle().press('i'))
    act(() => handle().press('p'))
    expect(handle().getSnapshot().readout).toBe('SET 8 · INKED · 4 PRINTS')
    expect(handle().getSnapshot().state).toBe('NO SHEET · N TO FEED')
    expect(svg()).not.toHaveClass('fed')
    expect(inside.querySelectorAll('.print')).toHaveLength(4)
    expect([...inside.querySelectorAll('.print')].at(-1)).toHaveTextContent('PRESS ON')
    // A second pull without feeding produces no print.
    act(() => handle().press('p'))
    expect(handle().getSnapshot().readout).toBe('SET 8 · INKED · 4 PRINTS')
    expect(inside.querySelectorAll('.print')).toHaveLength(4)
  })

  it('N feeds a new sheet, allowing another pull; ink eventually runs dry', async () => {
    const run = useFrames()
    const { handle, svg, inside } = mount(MiniatureLetterpress, { reducedMotion: 'always' })
    act(() => handle().press('p'))
    expect(handle().getSnapshot().readout).toBe('SET 8 · INK LOW · 4 PRINTS')
    act(() => handle().press('n'))
    expect(handle().getSnapshot().state).toBe('READY TO PULL')
    expect(svg()).toHaveClass('fed')
    act(() => handle().press('p'))
    expect(handle().getSnapshot().readout).toBe('SET 8 · DRY · 5 PRINTS')
    act(() => handle().press('n'))
    expect(handle().getSnapshot().state).toBe('FORM LOCKED · I TO INK')
    act(() => handle().press('n'))
    expect(handle().getSnapshot().state).toBe('SHEET ALREADY ON PLATEN')
    await run(1700)
    act(() => handle().press('p'))
    expect(handle().getSnapshot().readout).toBe('SET 8 · DRY · 6 PRINTS')
    expect(inside.querySelectorAll('.blind')).toHaveLength(1)
    expect(inside.querySelector('.blind')).toHaveTextContent('PRESS ON')
  })

  it('animates inking, pulling, delivery and feeding when motion is allowed', async () => {
    const run = useFrames()
    const { handle, svg, inside } = mount(MiniatureLetterpress)
    act(() => handle().press('i'))
    expect(handle().getSnapshot().state).toBe('INKING')
    await run(1600)
    expect(handle().getSnapshot().readout).toBe('SET 8 · INKED · 3 PRINTS')
    expect(handle().getSnapshot().state).toBe('READY TO PULL')
    act(() => handle().press('p'))
    expect(handle().getSnapshot().state).toBe('PRESSING')
    await run(1250)
    expect(handle().getSnapshot().state).toBe('DELIVERING')
    await run(800)
    expect(handle().getSnapshot().state).toBe('NO SHEET · N TO FEED')
    expect(inside.querySelectorAll('.print')).toHaveLength(4)
    act(() => handle().press('n'))
    expect(handle().getSnapshot().state).toBe('FEEDING')
    await run(900)
    expect(handle().getSnapshot().state).toBe('READY TO PULL')
    expect(svg()).toHaveClass('fed')
  })
})
