import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureHomeRouter, homeRouter } from './home-router'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureHomeRouter, homeRouter)

describe('HomeRouter', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "ONLINE · WI-FI 7 · 3 BANDS"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureHomeRouter, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: '3 DEVICES · 485 Mb/s', state: 'ONLINE · WI-FI 7 · 3 BANDS', pressed: {} })
    expect(svg()).toHaveClass('wifi')
  })

  it('1 (laptop) shows "LAPTOP DISCONNECTED"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureHomeRouter, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('1'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '2 DEVICES · 180 Mb/s', state: 'LAPTOP DISCONNECTED', pressed: {} })
  })

  it('2 (phone) shows "PHONE DISCONNECTED"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureHomeRouter, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('2'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '2 DEVICES · 594 Mb/s', state: 'PHONE DISCONNECTED', pressed: {} })
  })

  it('3 (speaker) shows "SPEAKER DISCONNECTED"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureHomeRouter, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('3'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '2 DEVICES · 637 Mb/s', state: 'SPEAKER DISCONNECTED', pressed: {} })
  })

  it('F (fiber) shows "FIBER UNPLUGGED"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureHomeRouter, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('f'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '3 DEVICES · 147 Mb/s', state: 'FIBER UNPLUGGED', pressed: {} })
  })

  it('R (reboot) shows "REBOOTING"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureHomeRouter, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('r'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '0 DEVICES · 147 Mb/s', state: 'REBOOTING', pressed: {} })
  })
})
