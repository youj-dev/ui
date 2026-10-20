import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureMetronome, metronome } from './metronome'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureMetronome, metronome)

describe('Metronome', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "RUNNING · 68% SPRING"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMetronome, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: '96 BPM · ANDANTE', state: 'RUNNING · 68% SPRING', pressed: { ' ': true } })
  })

  it('Space (start/stop) shows "STOPPED · 68% SPRING"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMetronome, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press(' '))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '96 BPM · ANDANTE', state: 'STOPPED · 68% SPRING', pressed: { ' ': false } })
    act(() => handle().press(' '))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '96 BPM · ANDANTE', state: 'RUNNING · 68% SPRING', pressed: { ' ': true } })
  })

  it('↑ ↓ (tempo) shows "RUNNING · 68% SPRING"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMetronome, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('ArrowUp'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '98 BPM · ANDANTE', state: 'RUNNING · 68% SPRING', pressed: { ' ': true } })
    act(() => handle().press('ArrowDown'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '96 BPM · ANDANTE', state: 'RUNNING · 68% SPRING', pressed: { ' ': true } })
  })

  it('W (wind) shows "WINDING · 92% SPRING"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMetronome, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('w'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '96 BPM · ANDANTE', state: 'WINDING · 92% SPRING', pressed: { ' ': true } })
  })

  it('P (tap) shows "LATE · +300 ms"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMetronome, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('p'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '96 BPM · ANDANTE', state: 'LATE · +300 ms', pressed: { ' ': true } })
  })

  it('B (bell) shows "BELL ON BEAT 1 OF 2"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMetronome, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('b'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '96 BPM · ANDANTE', state: 'BELL ON BEAT 1 OF 2', pressed: { ' ': true } })
  })
})
