import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureTypewriter, type MiniatureTypewriterKey, typewriter } from './typewriter'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureTypewriter, typewriter)

describe('Typewriter', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureTypewriterKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureTypewriter, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts ready on line six with the black ribbon and the lid off', async () => {
    const { snap } = await play()
    expect(snap()).toEqual(typewriter.initial)
  })

  it.each(['a', 'm', 'z'] as const)('%s types a letter and the carriage steps one column', async (key) => {
    const { snap } = await play([key])
    expect(snap().readout).toBe('LINE 6 · COL 16 · BLACK')
  })

  it('typing several letters advances the carriage that many columns', async () => {
    const { snap } = await play(['a', 'b', 'c'])
    expect(snap().readout).toBe('LINE 6 · COL 18 · BLACK')
  })

  it('Enter returns the carriage to the margin and feeds a line', async () => {
    const { snap } = await play(['a', 'Enter'])
    expect(snap().readout).toBe('LINE 7 · COL 0 · BLACK')
  })

  it('Backspace moves the carriage back one column without erasing', async () => {
    const { snap } = await play(['a', 'b', 'Backspace'])
    expect(snap().readout).toBe('LINE 6 · COL 16 · BLACK')
  })

  it('the down arrow selects the red ribbon and the up arrow the black one', async () => {
    const { handle, run, snap } = await play(['ArrowDown'])
    expect(snap().readout).toBe('LINE 6 · COL 15 · RED')
    act(() => handle().press('ArrowUp'))
    await run(400)
    expect(snap().readout).toBe('LINE 6 · COL 15 · BLACK')
  })

  it('Escape puts the lid on and takes it off again', async () => {
    const { handle, run, snap } = await play(['Escape'])
    expect(snap().state).toBe('LID ON · ESC TO LIFT IT')
    expect(snap().pressed.Escape).toBe(true)
    act(() => handle().press('Escape'))
    await run(400)
    expect(snap().state).toBe('READY · TYPE ON YOUR KEYBOARD')
    expect(snap().pressed.Escape).toBe(false)
  })
})
