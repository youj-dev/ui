import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureToaster, type MiniatureToasterKey, toaster } from './toaster'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureToaster, toaster)

describe('Toaster', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureToasterKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureToaster, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts ready with two slices, browning at level three', async () => {
    const { snap, svg } = await play()
    expect(snap()).toEqual(toaster.initial)
    expect(svg()).not.toHaveClass('toasting')
  })

  it('Space pushes the lever down and the toaster toasts', async () => {
    const { snap, svg } = await play([' '])
    expect(snap().state).toBe('TOASTING / TWO FACES')
    expect(snap().readout).toMatch(/^03 \/ 06 · [1-9]\d s$/)
    expect(svg()).toHaveClass('toasting')
  })

  it.each([
    ['1', 'PALE'],
    ['2', 'LIGHT'],
    ['3', 'GOLDEN'],
    ['4', 'AMBER'],
    ['5', 'DEEP'],
    ['6', 'DARK'],
  ] as const)('%s sets browning level %s', async (key, name) => {
    const { snap } = await play([key])
    expect(snap().readout).toBe(`0${key} / 06 · 00 s`)
    expect(snap().state).toBe(`LEVEL ${key} / ${name}`)
  })

  it('C cancels a toast in progress', async () => {
    const { handle, run, snap, svg } = await play([' '])
    act(() => handle().press('c'))
    await run(400)
    expect(snap().state).toBe('CANCELLED / TOAST RELEASED')
    expect(svg()).not.toHaveClass('toasting')
  })

  it('B switches to the bagel setting, heating the cut faces', async () => {
    const { snap, svg } = await play(['b'])
    expect(snap().state).toBe('BAGEL / INNER HEAT')
    expect(svg()).toHaveClass('bagel')
  })

  it('T opens the crumb tray', async () => {
    const { snap } = await play(['t'])
    expect(snap().state).toBe('CRUMB TRAY OPEN')
  })
})
