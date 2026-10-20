import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureLighthouse, lighthouse } from './lighthouse'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureLighthouse, lighthouse)

describe('Lighthouse', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "BEAM 147° · VIS 24 NM"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureLighthouse, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: 'DAY · LAMP OFF · CLEAR', state: 'BEAM 147° · VIS 24 NM', pressed: { l: false, f: false, d: false } })
  })

  it('L (lamp) shows "BEAM 147° · VIS 24 NM"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureLighthouse, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('l'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'DAY · LAMP ON · CLEAR', state: 'BEAM 147° · VIS 24 NM', pressed: { l: true, f: false, d: false } })
    act(() => handle().press('l'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'DAY · LAMP OFF · CLEAR', state: 'BEAM 147° · VIS 24 NM', pressed: { l: false, f: false, d: false } })
  })

  it('Space (fog horn) shows "FOG HORN · 2 S BLAST"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureLighthouse, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press(' '))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'DAY · LAMP OFF · CLEAR', state: 'FOG HORN · 2 S BLAST', pressed: { l: false, f: false, d: false } })
  })

  it('F (fog) shows "BEAM 147° · VIS 2 NM · HORN EVERY 20 S"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureLighthouse, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('f'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'DAY · LAMP OFF · FOG', state: 'BEAM 147° · VIS 2 NM · HORN EVERY 20 S', pressed: { l: false, f: true, d: false } })
    act(() => handle().press('f'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'DAY · LAMP OFF · CLEAR', state: 'BEAM 147° · VIS 24 NM', pressed: { l: false, f: false, d: false } })
  })

  it('D (day / night) shows "BEAM 147° · VIS 18 NM"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureLighthouse, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('d'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'NIGHT · LAMP OFF · CLEAR', state: 'BEAM 147° · VIS 18 NM', pressed: { l: false, f: false, d: true } })
    act(() => handle().press('d'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'DAY · LAMP OFF · CLEAR', state: 'BEAM 147° · VIS 24 NM', pressed: { l: false, f: false, d: false } })
  })
})
