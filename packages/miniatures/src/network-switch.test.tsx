import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureNetworkSwitch, networkSwitch } from './network-switch'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureNetworkSwitch, networkSwitch)

describe('NetworkSwitch', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "FORWARDING · BUSY"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureNetworkSwitch, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: '5/8 UP · 2.95 Gb/s', state: 'FORWARDING · BUSY', pressed: {} })
    expect(svg()).toHaveClass('powered', 'l1')
  })

  it('O (power) shows "STANDBY · O TO POWER"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureNetworkSwitch, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('o'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '0/8 UP · 1.06 Gb/s', state: 'STANDBY · O TO POWER', pressed: {} })
    expect(svg()).not.toHaveClass('powered')
  })

  it('1–8 (patch) shows "PORT 1 UNPATCHED"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureNetworkSwitch, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('1'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '4/8 UP · 3.42 Gb/s', state: 'PORT 1 UNPATCHED', pressed: {} })
    act(() => handle().press('2'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '3/8 UP · 3.12 Gb/s', state: 'PORT 2 UNPATCHED', pressed: {} })
    act(() => handle().press('3'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '2/8 UP · 2.41 Gb/s', state: 'PORT 3 UNPATCHED', pressed: {} })
    act(() => handle().press('4'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '3/8 UP · 2.57 Gb/s', state: 'PORT 4 PATCHED', pressed: {} })
    act(() => handle().press('5'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '2/8 UP · 2.16 Gb/s', state: 'PORT 5 UNPATCHED', pressed: {} })
    act(() => handle().press('6'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '1/8 UP · 1.32 Gb/s', state: 'PORT 6 UNPATCHED', pressed: {} })
    act(() => handle().press('7'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '2/8 UP · 1.67 Gb/s', state: 'PORT 7 PATCHED', pressed: {} })
    act(() => handle().press('8'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '3/8 UP · 2.20 Gb/s', state: 'PORT 8 PATCHED', pressed: {} })
  })

  it('T (traffic) shows "LOAD PEAK"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureNetworkSwitch, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('t'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '5/8 UP · 8.46 Gb/s', state: 'LOAD PEAK', pressed: {} })
    expect(svg()).toHaveClass('l2')
    expect(svg()).not.toHaveClass('l1')
  })

  it('F (fail a port) shows "PORT 1 DOWN · LINK LOST"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureNetworkSwitch, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('f'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '4/8 UP · 3.42 Gb/s', state: 'PORT 1 DOWN · LINK LOST', pressed: {} })
  })
})
