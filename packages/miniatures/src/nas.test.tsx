import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureNas, nas } from './nas'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureNas, nas)

describe('Nas', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "HEALTHY · IDLE"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureNas, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: '4/4 DRIVES · 0 MB/s', state: 'HEALTHY · IDLE', pressed: {} })
    expect(svg()).toHaveClass('powered')
  })

  it('O (power) shows "STANDBY · O TO POWER"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureNas, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('o'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '4/4 DRIVES · 0 MB/s', state: 'STANDBY · O TO POWER', pressed: {} })
    expect(svg()).not.toHaveClass('powered')
  })

  it('1–4 (pull / insert drive) shows "ARRAY DEGRADED"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureNas, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('1'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '3/4 DRIVES · 0 MB/s', state: 'ARRAY DEGRADED', pressed: {} })
    act(() => handle().press('2'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '2/4 DRIVES · 0 MB/s', state: 'VOLUME FAILED', pressed: {} })
    expect(svg()).toHaveClass('alarm')
    act(() => handle().press('3'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '1/4 DRIVES · 0 MB/s', state: 'VOLUME FAILED', pressed: {} })
    act(() => handle().press('4'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '0/4 DRIVES · 0 MB/s', state: 'VOLUME FAILED', pressed: {} })
  })

  it('T (transfer) shows "TRANSFER STARTED"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureNas, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('t'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '4/4 DRIVES · 277 MB/s', state: 'TRANSFER STARTED', pressed: {} })
  })
})
