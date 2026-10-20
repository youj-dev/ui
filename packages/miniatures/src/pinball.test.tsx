import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniaturePinball, type MiniaturePinballKey, pinball } from './pinball'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniaturePinball, pinball)

describe('Pinball', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniaturePinballKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniaturePinball, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  const key = (target: EventTarget, k: string, type = 'keydown') => act(() => void target.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true, composed: true, cancelable: true })))

  it('starts on ball one with the plunger waiting to be pulled', async () => {
    const { snap, svg } = await play()
    expect(snap()).toEqual(pinball.initial)
    expect(svg()).not.toHaveClass('live')
  })

  it('Space pulls and launches the ball, and the game is live', async () => {
    const { snap, svg } = await play([' '])
    expect(snap().state).toBe('LAUNCH')
    expect(svg()).toHaveClass('live')
  })

  it('N starts a new game on ball one', async () => {
    const { snap, svg } = await play(['n'])
    expect(snap().readout).toBe('0 · BALL 1')
    expect(snap().state).toBe('BALL 1')
    expect(svg()).toHaveClass('live')
  })

  it('T nudges the table, and nudging again warns of a tilt', async () => {
    const one = await play(['t'])
    expect(one.snap().state).toBe('NUDGE')
    cleanup()
    const two = await play(['t', 't'])
    expect(two.snap().state).toBe('DANGER')
  })

  it('Z and M hold the flippers while down: the left flipper button presses in', async () => {
    const { host, inside, run } = await play()
    const button = inside.querySelector('[aria-label="Left flipper (Z)"]')!
    expect(button).not.toHaveAttribute('transform', expect.stringContaining('translate'))
    key(host, 'z')
    await run(100)
    expect(button).toHaveAttribute('transform', expect.stringContaining('translate'))
    key(host, 'z', 'keyup')
    await run(100)
    expect(button).not.toHaveAttribute('transform', expect.stringContaining('translate'))
  })
})
