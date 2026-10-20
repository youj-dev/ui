import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureGroundStation, groundStation } from './ground-station'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureGroundStation, groundStation)

describe('GroundStation', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "STOWED · SPACE FOR NEXT PASS"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureGroundStation, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: 'AZ 45.0° · EL 90.0° · SNR 0.0 dB', state: 'STOWED · SPACE FOR NEXT PASS', pressed: { ' ': false, d: false } })
  })

  it('Space (track pass) shows "TRACKING NOVA–7 · 0.00 GB"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureGroundStation, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press(' '))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'AZ 118.6° · EL 17.7° · SNR 10.1 dB', state: 'TRACKING NOVA–7 · 0.00 GB', pressed: { ' ': true, d: false } })
    act(() => handle().press(' '))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'AZ 45.0° · EL 90.0° · SNR 0.0 dB', state: 'STOWED · SPACE FOR NEXT PASS', pressed: { ' ': false, d: false } })
  })

  it('← → (azimuth) shows "MANUAL JOG"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureGroundStation, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('ArrowLeft'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'AZ 40.0° · EL 90.0° · SNR 0.0 dB', state: 'MANUAL JOG', pressed: { ' ': false, d: false } })
    act(() => handle().press('ArrowRight'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'AZ 45.0° · EL 90.0° · SNR 0.0 dB', state: 'MANUAL JOG', pressed: { ' ': false, d: false } })
  })

  it('↑ ↓ (elevation) shows "MANUAL JOG · EL LIMIT 90°"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureGroundStation, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('ArrowUp'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'AZ 45.0° · EL 90.0° · SNR 0.0 dB', state: 'MANUAL JOG · EL LIMIT 90°', pressed: { ' ': false, d: false } })
    act(() => handle().press('ArrowDown'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'AZ 45.0° · EL 87.0° · SNR 0.0 dB', state: 'MANUAL JOG', pressed: { ' ': false, d: false } })
  })

  it('S (stow) shows "STOWED · SPACE FOR NEXT PASS"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureGroundStation, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('s'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'AZ 45.0° · EL 90.0° · SNR 0.0 dB', state: 'STOWED · SPACE FOR NEXT PASS', pressed: { ' ': false, d: false } })
  })

  it('D (door) shows "STOWED · SPACE FOR NEXT PASS · DOOR OPEN"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureGroundStation, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('d'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'AZ 45.0° · EL 90.0° · SNR 0.0 dB', state: 'STOWED · SPACE FOR NEXT PASS · DOOR OPEN', pressed: { ' ': false, d: true } })
    act(() => handle().press('d'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'AZ 45.0° · EL 90.0° · SNR 0.0 dB', state: 'STOWED · SPACE FOR NEXT PASS', pressed: { ' ': false, d: false } })
  })
})
