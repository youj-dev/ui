import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureFilmProjector, filmProjector } from './film-projector'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureFilmProjector, filmProjector)

describe('FilmProjector', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "STANDBY · STILL FRAME"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureFilmProjector, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: '00 fps · 0420 · SHARP', state: 'STANDBY · STILL FRAME', pressed: { ' ': false, l: true, r: false } })
  })

  it('Space (run) shows "PROJECTING · THE VIADUCT"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureFilmProjector, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press(' '))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '24 fps · 0428 · SHARP', state: 'PROJECTING · THE VIADUCT', pressed: { ' ': true, l: true, r: false } })
    act(() => handle().press(' '))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '00 fps · 0429 · SHARP', state: 'STANDBY · STILL FRAME', pressed: { ' ': false, l: true, r: false } })
  })

  it('L (lamp) shows "STANDBY · LAMP OFF"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureFilmProjector, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('l'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '00 fps · 0420 · SHARP', state: 'STANDBY · LAMP OFF', pressed: { ' ': false, l: false, r: false } })
    act(() => handle().press('l'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '00 fps · 0420 · SHARP', state: 'STANDBY · STILL FRAME', pressed: { ' ': false, l: true, r: false } })
  })

  it('← → (focus) shows "FOCUS −1 · SOFT"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureFilmProjector, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('ArrowLeft'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '00 fps · 0420 · SOFT −1', state: 'FOCUS −1 · SOFT', pressed: { ' ': false, l: true, r: false } })
    act(() => handle().press('ArrowRight'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '00 fps · 0420 · SHARP', state: 'FOCUS · SHARP', pressed: { ' ': false, l: true, r: false } })
  })

  it('↑ ↓ (framing) shows "FRAMING +1"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureFilmProjector, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('ArrowUp'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '00 fps · 0420 · SHARP · FRAME +1', state: 'FRAMING +1', pressed: { ' ': false, l: true, r: false } })
    act(() => handle().press('ArrowDown'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '00 fps · 0420 · SHARP', state: 'FRAMING · CENTRED', pressed: { ' ': false, l: true, r: false } })
  })

  it('R (rewind) shows "REWINDING · 8×"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureFilmProjector, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('r'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'REW ×8 · 0355 · SHARP', state: 'REWINDING · 8×', pressed: { ' ': false, l: true, r: true } })
  })

  it('C (countdown) shows "CUEING · REWINDING TO LEADER"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureFilmProjector, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('c'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'REW ×8 · 0355 · SHARP', state: 'CUEING · REWINDING TO LEADER', pressed: { ' ': false, l: true, r: true } })
  })
})
