import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureVintageCamera, type MiniatureVintageCameraKey, vintageCamera } from './vintage-camera'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureVintageCamera, vintageCamera)

describe('VintageCamera', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureVintageCameraKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureVintageCamera, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts powered on, focused at 1.2 m, with the screen out and no shots', async () => {
    const { snap } = await play()
    expect(snap()).toEqual(vintageCamera.initial)
  })

  it('O powers it off, and it takes no picture until it is on', async () => {
    const { handle, run, snap } = await play(['o'])
    expect(snap().state).toBe('OFF · O TO POWER')
    expect(snap().pressed.o).toBe(false)
    act(() => handle().press(' '))
    await run(400)
    expect(snap().state).toBe('POWER OFF · PRESS O')
    act(() => handle().press('o'))
    await run(400)
    expect(snap().pressed.o).toBe(true)
  })

  it('Space takes a picture and saves frame one', async () => {
    const { snap } = await play([' '])
    expect(snap().state).toBe('FRAME 0001 · SAVED')
  })

  it.each([
    ['s', '1/125 · f/2 · ISO 400 · ±0.0'],
    ['i', '1/60 · f/2 · ISO 800 · ±0.0'],
    ['e', '1/60 · f/2 · ISO 400 · +0.3'],
    ['a', '1/60 · f/2.8 · ISO 400 · ±0.0'],
  ] as const)('%s steps its dial: %s', async (key, readout) => {
    const { snap } = await play([key])
    expect(snap().readout).toBe(readout)
  })

  it('Shift with a dial key steps it the other way', async () => {
    const { snap } = await play(['shift+s'])
    expect(snap().readout).toBe('1/30 · f/2 · ISO 400 · ±0.0')
  })

  it('the left and right arrows rack the focus', async () => {
    const left = await play(['ArrowLeft'])
    expect(left.snap().state).toMatch(/^FOCUSED 1\.1 M/)
    cleanup()
    const right = await play(['ArrowRight'])
    expect(right.snap().state).toMatch(/^FOCUSED 1\.3 M/)
  })

  it('F stows the screen and brings it back', async () => {
    const { handle, run, snap } = await play(['f'])
    expect(snap().state).toBe('SCREEN STOWED')
    expect(snap().pressed.f).toBe(false)
    act(() => handle().press('f'))
    await run(400)
    expect(snap().pressed.f).toBe(true)
  })
})
