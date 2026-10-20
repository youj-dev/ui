import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureOrrery, orrery } from './orrery'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureOrrery, orrery)

describe('Orrery', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "LAMP OFF · CRANK 0.0 TURNS"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureOrrery, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: '06 OCT 2026 · +0 D', state: 'LAMP OFF · CRANK 0.0 TURNS', pressed: { ' ': false, l: false } })
  })

  it('← → (crank) shows "LAMP OFF · CRANK -0.1 TURNS"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureOrrery, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('ArrowLeft'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '02 OCT 2026 · -4 D', state: 'LAMP OFF · CRANK -0.1 TURNS', pressed: { ' ': false, l: false } })
    act(() => handle().press('ArrowRight'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '06 OCT 2026 · +0 D', state: 'LAMP OFF · CRANK 0.0 TURNS', pressed: { ' ': false, l: false } })
  })

  it('Space (drive) shows "LAMP OFF · DRIVE ON"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureOrrery, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press(' '))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '18 OCT 2026 · +12 D', state: 'LAMP OFF · DRIVE ON', pressed: { ' ': true, l: false } })
    expect(svg()).toHaveClass('driving')
    act(() => handle().press(' '))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '18 OCT 2026 · +12 D', state: 'LAMP OFF · CRANK 0.4 TURNS', pressed: { ' ': false, l: false } })
    expect(svg()).not.toHaveClass('driving')
  })

  it('L (lamp) shows "LAMP ON · CRANK 0.0 TURNS"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureOrrery, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('l'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '06 OCT 2026 · +0 D', state: 'LAMP ON · CRANK 0.0 TURNS', pressed: { ' ': false, l: true } })
    expect(svg()).toHaveClass('lit')
    act(() => handle().press('l'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '06 OCT 2026 · +0 D', state: 'LAMP OFF · CRANK 0.0 TURNS', pressed: { ' ': false, l: false } })
    expect(svg()).not.toHaveClass('lit')
  })

  it('1 (–) shows "MERCURY · 88 D · 30°"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureOrrery, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('1'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '06 OCT 2026 · +0 D', state: 'MERCURY · 88 D · 30°', pressed: { ' ': false, l: false } })
  })

  it('6 (planet) shows "SATURN · 29.5 YR · 250°"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureOrrery, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('6'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '06 OCT 2026 · +0 D', state: 'SATURN · 29.5 YR · 250°', pressed: { ' ': false, l: false } })
  })

  it('R (today) shows "LAMP OFF · CRANK 0.0 TURNS"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureOrrery, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('r'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '06 OCT 2026 · +0 D', state: 'LAMP OFF · CRANK 0.0 TURNS', pressed: { ' ': false, l: false } })
  })
})
