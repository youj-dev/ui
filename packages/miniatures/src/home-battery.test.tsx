import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureHomeBattery, homeBattery } from './home-battery'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureHomeBattery, homeBattery)

describe('HomeBattery', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "CHARGING +3.7 kW"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureHomeBattery, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: expect.stringMatching(/^\d\d:\d\d · SOLAR [\d.]+ kW · HOME 0\.8 kW · BATTERY \d+%/), state: 'CHARGING +3.7 kW', pressed: { g: false, l: false, p: false } })
  })

  it('N (skip 6 h) shows "CHARGING +3.4 kW"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureHomeBattery, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('n'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: expect.stringMatching(/^\d\d:\d\d · SOLAR [\d.]+ kW · HOME 0\.8 kW · BATTERY \d+%/), state: 'CHARGING +3.4 kW', pressed: { g: false, l: false, p: false } })
  })

  it('G (grid outage) shows "GRID OUTAGE · BACKUP POWER · CHARGING +3.8 kW"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureHomeBattery, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('g'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: expect.stringMatching(/^\d\d:\d\d · SOLAR [\d.]+ kW · HOME 0\.8 kW · BATTERY \d+%/), state: 'GRID OUTAGE · BACKUP POWER · CHARGING +3.8 kW', pressed: { g: true, l: false, p: false } })
    act(() => handle().press('g'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: expect.stringMatching(/^\d\d:\d\d · SOLAR [\d.]+ kW · HOME 0\.8 kW · BATTERY \d+%/), state: 'CHARGING +3.9 kW', pressed: { g: false, l: false, p: false } })
  })

  it('L (air conditioner) shows "CHARGING +0.8 kW"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureHomeBattery, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('l'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: expect.stringMatching(/^\d\d:\d\d · SOLAR [\d.]+ kW · HOME 3\.8 kW · BATTERY \d+%/), state: 'CHARGING +0.8 kW', pressed: { g: false, l: true, p: false } })
    act(() => handle().press('l'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: expect.stringMatching(/^\d\d:\d\d · SOLAR [\d.]+ kW · HOME 0\.8 kW · BATTERY \d+%/), state: 'CHARGING +3.9 kW', pressed: { g: false, l: false, p: false } })
  })

  it('P (pause clock) shows "CLOCK PAUSED"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureHomeBattery, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('p'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: expect.stringMatching(/^\d\d:\d\d · SOLAR [\d.]+ kW · HOME 0\.8 kW · BATTERY \d+%/), state: 'CLOCK PAUSED', pressed: { g: false, l: false, p: true } })
    act(() => handle().press('p'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: expect.stringMatching(/^\d\d:\d\d · SOLAR [\d.]+ kW · HOME 0\.8 kW · BATTERY \d+%/), state: 'CLOCK RUNNING', pressed: { g: false, l: false, p: false } })
  })
})
