import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureInstantCamera, instantCamera } from './instant-camera'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureInstantCamera, instantCamera)

describe('InstantCamera', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "FLASH ON · READY"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureInstantCamera, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: '60 mm · 08 left', state: 'FLASH ON · READY', pressed: {} })
    expect(svg()).toHaveClass('flash-enabled', 'charged')
  })

  it('Space (shutter) shows "EJECTING PRINT"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureInstantCamera, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press(' '))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '60 mm · 07 left', state: 'EJECTING PRINT', pressed: {} })
  })

  it('T (self-timer) shows "SELF-TIMER · 3"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureInstantCamera, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('t'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '60 mm · 08 left', state: 'SELF-TIMER · 3', pressed: {} })
  })

  it('F (flash) shows "FLASH OFF"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureInstantCamera, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('f'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '60 mm · 08 left', state: 'FLASH OFF', pressed: {} })
    expect(svg()).not.toHaveClass('charged', 'flash-enabled')
  })

  it('Z (focus) shows "75 MM · RING SET"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureInstantCamera, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('z'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '75 mm · 08 left', state: '75 MM · RING SET', pressed: {} })
  })

  it('D (film door) shows "FILM DOOR OPEN"', async () => {
    const run = useFrames()
    const { handle, svg } = mount(MiniatureInstantCamera, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('d'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '60 mm · 08 left', state: 'FILM DOOR OPEN', pressed: {} })
    expect(svg()).toHaveClass('door-open')
  })

  it('P (collect print · or click it) shows "NO PRINT TO COLLECT"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureInstantCamera, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('p'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: '60 mm · 08 left', state: 'NO PRINT TO COLLECT', pressed: {} })
  })
})
