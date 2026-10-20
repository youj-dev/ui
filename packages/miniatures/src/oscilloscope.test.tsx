import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureOscilloscope, oscilloscope } from './oscilloscope'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureOscilloscope, oscilloscope)

describe('Oscilloscope', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "LIVE · 1 kHz · 4 Vpp"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureOscilloscope, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: 'Sine · 1 V/div · 0.2 ms/div', state: 'LIVE · 1 kHz · 4 Vpp', pressed: {} })
    expect(svg()).toHaveClass('powered', 'live')
  })

  it('1–3 (sine / square / saw) shows "LIVE · 1 kHz · 4 Vpp"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureOscilloscope, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('1'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'Sine · 1 V/div · 0.2 ms/div', state: 'LIVE · 1 kHz · 4 Vpp', pressed: {} })
    act(() => handle().press('2'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'Square · 1 V/div · 0.2 ms/div', state: 'LIVE · 1 kHz · 4 Vpp', pressed: {} })
    act(() => handle().press('3'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'Saw · 1 V/div · 0.2 ms/div', state: 'LIVE · 1 kHz · 4 Vpp', pressed: {} })
  })

  it('↑ ↓ (volts/div) shows "LIVE · 1 kHz · 4 Vpp"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureOscilloscope, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('ArrowUp'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'Sine · 2 V/div · 0.2 ms/div', state: 'LIVE · 1 kHz · 4 Vpp', pressed: {} })
    act(() => handle().press('ArrowDown'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'Sine · 1 V/div · 0.2 ms/div', state: 'LIVE · 1 kHz · 4 Vpp', pressed: {} })
  })

  it('← → (time/div) shows "LIVE · 1 kHz · 4 Vpp"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureOscilloscope, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('ArrowLeft'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'Sine · 1 V/div · 0.1 ms/div', state: 'LIVE · 1 kHz · 4 Vpp', pressed: {} })
    act(() => handle().press('ArrowRight'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'Sine · 1 V/div · 0.2 ms/div', state: 'LIVE · 1 kHz · 4 Vpp', pressed: {} })
  })

  it('F (frequency) shows "LIVE · 2 kHz · 4 Vpp"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureOscilloscope, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('f'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'Sine · 1 V/div · 0.2 ms/div', state: 'LIVE · 2 kHz · 4 Vpp', pressed: {} })
  })

  it('G (output) shows "OUTPUT OFF · FLAT TRACE"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureOscilloscope, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('g'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'Sine · 1 V/div · 0.2 ms/div', state: 'OUTPUT OFF · FLAT TRACE', pressed: {} })
    expect(svg()).not.toHaveClass('live')
  })

  it('Space (hold) shows "HELD · 1 kHz · 4 Vpp"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureOscilloscope, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press(' '))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'Sine · 1 V/div · 0.2 ms/div', state: 'HELD · 1 kHz · 4 Vpp', pressed: {} })
    expect(svg()).toHaveClass('holding')
  })

  it('O (power) shows "POWER OFF"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureOscilloscope, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('o'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'Sine · 1 V/div · 0.2 ms/div', state: 'POWER OFF', pressed: {} })
    expect(svg()).not.toHaveClass('live', 'powered')
  })
})
