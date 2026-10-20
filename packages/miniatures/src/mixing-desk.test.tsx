import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureMixingDesk, mixingDesk } from './mixing-desk'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureMixingDesk, mixingDesk)

describe('MixingDesk', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "KICK · LIVE"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureMixingDesk, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: 'CH 1 · −4 dB · STOPPED', state: 'KICK · LIVE', pressed: {} })
    expect(svg()).toHaveClass('ready')
  })

  it('Space (play) shows "KICK · LIVE"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureMixingDesk, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press(' '))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'CH 1 · −4 dB · PLAYING', state: 'KICK · LIVE', pressed: {} })
    expect(svg()).toHaveClass('playing')
    expect(svg()).not.toHaveClass('ready')
  })

  it('1 (–) shows "KICK · LIVE"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMixingDesk, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('1'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'CH 1 · −4 dB · STOPPED', state: 'KICK · LIVE', pressed: {} })
  })

  it('4 (channel) shows "HATS · LIVE"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMixingDesk, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('4'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'CH 4 · −5 dB · STOPPED', state: 'HATS · LIVE', pressed: {} })
  })

  it('↑ ↓ (fader) shows "KICK · LIVE"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMixingDesk, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('ArrowUp'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'CH 1 · −2 dB · STOPPED', state: 'KICK · LIVE', pressed: {} })
    act(() => handle().press('ArrowDown'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'CH 1 · −4 dB · STOPPED', state: 'KICK · LIVE', pressed: {} })
  })

  it('M (mute) shows "KICK · MUTED"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMixingDesk, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('m'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'CH 1 · −4 dB · STOPPED', state: 'KICK · MUTED', pressed: {} })
  })

  it('S (solo) shows "KICK · SOLO"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMixingDesk, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('s'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'CH 1 · −4 dB · STOPPED', state: 'KICK · SOLO', pressed: {} })
  })
})
