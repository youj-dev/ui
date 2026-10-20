import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureMicroscope, microscope } from './microscope'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureMicroscope, microscope)

describe('Microscope', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "IN FOCUS · LIGHT ON"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureMicroscope, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: '10× · 0.90 mm', state: 'IN FOCUS · LIGHT ON', pressed: {} })
    expect(svg()).toHaveClass('powered')
  })

  it('1 2 3 (objective) shows "4× INDEXING"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMicroscope, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('1'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '4× · 0.90 mm', state: '4× INDEXING', pressed: {} })
    act(() => handle().press('2'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '10× · 0.90 mm', state: '10× INDEXING', pressed: {} })
    act(() => handle().press('3'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '40× · 0.90 mm', state: '40× INDEXING', pressed: {} })
  })

  it('↑ ↓ (focus) shows "STAGE RAISED"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMicroscope, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('ArrowUp'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '10× · 0.93 mm', state: 'STAGE RAISED', pressed: {} })
    act(() => handle().press('ArrowDown'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '10× · 0.90 mm', state: 'STAGE LOWERED', pressed: {} })
  })

  it('← → (stage) shows "STAGE X -0.3 mm"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMicroscope, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('ArrowLeft'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '10× · 0.90 mm', state: 'STAGE X -0.3 mm', pressed: {} })
    act(() => handle().press('ArrowRight'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '10× · 0.90 mm', state: 'STAGE X 0.0 mm', pressed: {} })
  })

  it('F (filter) shows "BLUE FILTER"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMicroscope, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('f'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '10× · 0.90 mm', state: 'BLUE FILTER', pressed: {} })
  })

  it('L (light) shows "ILLUMINATOR OFF"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureMicroscope, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('l'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '10× · 0.90 mm', state: 'ILLUMINATOR OFF', pressed: {} })
    expect(svg()).not.toHaveClass('powered')
  })
})
