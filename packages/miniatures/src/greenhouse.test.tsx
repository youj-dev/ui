import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureGreenhouse, greenhouse } from './greenhouse'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureGreenhouse, greenhouse)

describe('Greenhouse', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "GROWING · ALL CLOSED"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureGreenhouse, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: '27.0 °C · 55 % RH · DAY', state: 'GROWING · ALL CLOSED', pressed: { v: false, m: false, l: false, f: false, n: false } })
  })

  it('V (vents) shows "GROWING · VENTS 32°"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureGreenhouse, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('v'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '19.5 °C · 42 % RH · DAY', state: 'GROWING · VENTS 32°', pressed: { v: true, m: false, l: false, f: false, n: false } })
    act(() => handle().press('v'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '27.0 °C · 55 % RH · DAY', state: 'GROWING · ALL CLOSED', pressed: { v: false, m: false, l: false, f: false, n: false } })
  })

  it('M (mist) shows "GROWING · MISTING"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureGreenhouse, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('m'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '24.8 °C · 87 % RH · DAY', state: 'GROWING · MISTING', pressed: { v: false, m: true, l: false, f: false, n: false } })
    expect(svg()).toHaveClass('misting')
    act(() => handle().press('m'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '27.0 °C · 55 % RH · DAY', state: 'GROWING · ALL CLOSED', pressed: { v: false, m: false, l: false, f: false, n: false } })
    expect(svg()).not.toHaveClass('misting')
  })

  it('L (grow lights) shows "GROWING · GROW LIGHTS"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureGreenhouse, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('l'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '29.2 °C · 55 % RH · DAY', state: 'GROWING · GROW LIGHTS', pressed: { v: false, m: false, l: true, f: false, n: false } })
    expect(svg()).toHaveClass('lit')
    act(() => handle().press('l'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '27.0 °C · 55 % RH · DAY', state: 'GROWING · ALL CLOSED', pressed: { v: false, m: false, l: false, f: false, n: false } })
    expect(svg()).not.toHaveClass('lit')
  })

  it('F (fan) shows "GROWING · FAN"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureGreenhouse, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('f'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '25.5 °C · 50 % RH · DAY', state: 'GROWING · FAN', pressed: { v: false, m: false, l: false, f: true, n: false } })
    expect(svg()).toHaveClass('fanning')
    act(() => handle().press('f'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '27.0 °C · 55 % RH · DAY', state: 'GROWING · ALL CLOSED', pressed: { v: false, m: false, l: false, f: false, n: false } })
    expect(svg()).not.toHaveClass('fanning')
  })

  it('N (day / night) shows "GROWING · ALL CLOSED"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureGreenhouse, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('n'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '15.0 °C · 67 % RH · NIGHT', state: 'GROWING · ALL CLOSED', pressed: { v: false, m: false, l: false, f: false, n: true } })
    act(() => handle().press('n'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '27.0 °C · 55 % RH · DAY', state: 'GROWING · ALL CLOSED', pressed: { v: false, m: false, l: false, f: false, n: false } })
  })
})
