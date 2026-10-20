import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureNixieClock, nixieClock } from './nixie-clock'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureNixieClock, nixieClock)

describe('NixieClock', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "RUNNING · CYCLE IN 30 S"', async () => {
    const run = useFrames()
    vi.setSystemTime(new Date(2026, 0, 1, 10, 20, 30))
    const { handle } = mount(MiniatureNixieClock, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: '10:20:30 · 24H · DAY', state: 'RUNNING · CYCLE IN 30 S', pressed: { h: false } })
  })

  it('S (set) shows "SET HOURS · ↑ ↓"', async () => {
    const run = useFrames()
    vi.setSystemTime(new Date(2026, 0, 1, 10, 20, 30))
    const { handle } = mount(MiniatureNixieClock, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('s'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '10:20:30 · 24H · DAY', state: 'SET HOURS · ↑ ↓', pressed: { h: false } })
  })

  it('↑ ↓ (adjust) shows "PRESS S TO SET"', async () => {
    const run = useFrames()
    vi.setSystemTime(new Date(2026, 0, 1, 10, 20, 30))
    const { handle } = mount(MiniatureNixieClock, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('ArrowUp'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '10:20:30 · 24H · DAY', state: 'PRESS S TO SET', pressed: { h: false } })
    act(() => handle().press('ArrowDown'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '10:20:31 · 24H · DAY', state: 'PRESS S TO SET', pressed: { h: false } })
  })

  it('C (cycle) shows "CATHODE CYCLE"', async () => {
    const run = useFrames()
    vi.setSystemTime(new Date(2026, 0, 1, 10, 20, 30))
    const { handle } = mount(MiniatureNixieClock, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('c'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '10:20:30 · 24H · DAY', state: 'CATHODE CYCLE', pressed: { h: false } })
  })

  it('D (dim / night) shows "RUNNING · CYCLE IN 30 S"', async () => {
    const run = useFrames()
    vi.setSystemTime(new Date(2026, 0, 1, 10, 20, 30))
    const { handle } = mount(MiniatureNixieClock, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('d'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '10:20:30 · 24H · DIM', state: 'RUNNING · CYCLE IN 30 S', pressed: { h: false } })
  })

  it('H (12 / 24) shows "RUNNING · CYCLE IN 30 S"', async () => {
    const run = useFrames()
    vi.setSystemTime(new Date(2026, 0, 1, 10, 20, 30))
    const { handle } = mount(MiniatureNixieClock, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('h'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '10:20:30 AM · 12H · DAY', state: 'RUNNING · CYCLE IN 30 S', pressed: { h: true } })
    act(() => handle().press('h'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '10:20:31 · 24H · DAY', state: 'RUNNING · CYCLE IN 29 S', pressed: { h: false } })
  })
})
