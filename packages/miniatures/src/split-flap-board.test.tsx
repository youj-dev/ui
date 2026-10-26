import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { MiniatureReducedMotion } from './engine/types'
import { MiniatureSplitFlapBoard, type MiniatureSplitFlapBoardKey, splitFlapBoard } from './split-flap-board'
import { installAudio, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureSplitFlapBoard, splitFlapBoard)

describe('SplitFlapBoard', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it at 10:20:30 in the morning, presses the keys in order and lets it settle. */
  const play = async (
    keys: MiniatureSplitFlapBoardKey[] = [],
    { settle = 400, reducedMotion = 'always' as MiniatureReducedMotion, at = new Date(2026, 0, 1, 10, 20, 30), sound = false } = {},
  ) => {
    const run = useFrames()
    vi.setSystemTime(at)
    const view = mount(MiniatureSplitFlapBoard, { reducedMotion, sound })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    const part = (name: string) => view.inside.querySelector(`[aria-label^="${name}"]`)!
    const falling = () => view.inside.querySelectorAll('.flaps [visibility=visible]').length
    return { ...view, run, part, falling, snap: () => view.handle().getSnapshot() }
  }

  it('starts settled on the status message, moving on by itself', async () => {
    const { snap } = await play()
    expect(snap()).toEqual(splitFlapBoard.initial)
  })

  it('Space flips to the next message, the local time, and announces it', async () => {
    const { snap, inside } = await play([' '])
    expect(snap()).toEqual({ readout: 'LOCAL TIME · 10:20 AM', state: 'SETTLED · NEXT IN 7 S', pressed: { a: true } })
    expect(inside.querySelector('[role=status]')).toHaveTextContent('Local time: 10:20 AM.')
  })

  it('→ steps forward and ← steps back', async () => {
    const { handle, run, snap } = await play(['ArrowRight', 'ArrowRight'])
    expect(snap().readout).toBe('UPTIME · 99.98%')
    act(() => handle().press('ArrowLeft'))
    await run(400)
    expect(snap().readout).toBe('LOCAL TIME · 10:20 AM')
  })

  it('← from the first message wraps round to the last', async () => {
    const { snap } = await play(['ArrowLeft'])
    expect(snap().readout).toBe("WHAT'S NEW · DARK MODE")
  })

  it('moves on to the next message by itself once its countdown runs out', async () => {
    const { snap } = await play([], { settle: 4000 })
    expect(snap().readout).toBe('LOCAL TIME · 10:20 AM')
    expect(snap().state).toBe('SETTLED · NEXT IN 7 S')
  })

  it('A turns auto off, so the board holds its message, and on again', async () => {
    const { handle, run, snap } = await play(['a'])
    expect(snap()).toEqual({ readout: 'STATUS · ALL CLEAR', state: 'AUTO OFF', pressed: { a: false } })
    await run(9000)
    expect(snap()).toEqual({ readout: 'STATUS · ALL CLEAR', state: 'SETTLED · SPACE FOR NEXT', pressed: { a: false } })
    act(() => handle().press('a'))
    await run(400)
    expect(snap()).toEqual({ readout: 'STATUS · ALL CLEAR', state: 'AUTO ON', pressed: { a: true } })
  })

  it('H runs every drum home, then spells the same message again', async () => {
    const { run, snap } = await play(['h'], { settle: 100 })
    expect(snap().state).toBe('HOMING')
    await run(1000)
    expect(snap()).toEqual({ readout: 'STATUS · ALL CLEAR', state: 'SETTLED · NEXT IN 7 S', pressed: { a: true } })
  })

  it('in full motion, H spins the drums round and back before it settles', async () => {
    const { run, snap, falling } = await play(['h'], { settle: 300, reducedMotion: 'never' })
    expect(snap().state).toBe('HOMING')
    expect(falling()).toBeGreaterThan(0)
    await run(5000)
    expect(snap().state).toMatch(/^SETTLED/)
    expect(snap().readout).toBe('STATUS · ALL CLEAR')
    expect(falling()).toBe(0)
  })

  it('in full motion, flaps fall column by column until the board settles', async () => {
    const { run, snap, falling } = await play([' '], { settle: 80, reducedMotion: 'never' })
    expect(snap().state).toBe('FLIPPING')
    expect(falling()).toBeGreaterThan(0)
    await run(3000)
    expect(snap()).toEqual({ readout: 'LOCAL TIME · 10:20 AM', state: 'SETTLED · NEXT IN 6 S', pressed: { a: true } })
    expect(falling()).toBe(0)
  })

  it('with reduced motion, characters change without a flap falling', async () => {
    const { handle, run, snap, falling } = await play([], { settle: 50 })
    act(() => handle().press(' '))
    for (let i = 0; i < 6; i++) {
      await run(16)
      expect(falling()).toBe(0)
    }
    expect(snap().readout).toBe('LOCAL TIME · 10:20 AM')
  })

  it('the local time keeps time while it shows, the US way', async () => {
    const { run, snap } = await play(['a', ' '], { at: new Date(2026, 0, 1, 15, 4, 58) })
    expect(snap().readout).toBe('LOCAL TIME · 3:04 PM')
    await run(3000)
    expect(snap().readout).toBe('LOCAL TIME · 3:05 PM')
  })

  it('its parts work by pointer and by Enter: the board and next button flip, the switch and home button act', async () => {
    const { part, run, snap } = await play()
    act(() => void part('Split-flap board').dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(400)
    expect(snap().readout).toBe('LOCAL TIME · 10:20 AM')
    act(() => void part('Next button').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })))
    await run(400)
    expect(snap().readout).toBe('UPTIME · 99.98%')
    act(() => void part('Auto switch').dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(400)
    expect(snap().pressed.a).toBe(false)
    expect(part('Auto switch')).toHaveAttribute('aria-pressed', 'false')
    act(() => void part('Home button').dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(100)
    expect(snap().state).toBe('HOMING')
  })

  it('clatters only once sound is on and someone has pressed something', async () => {
    const audio = installAudio()
    try {
      const { handle, host, run } = await play([], { reducedMotion: 'never', sound: true, settle: 100 })
      expect(audio.created).toHaveLength(0)
      act(() => void host.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true })))
      act(() => handle().press(' '))
      await run(1500)
      expect(audio.created).toHaveLength(1)
    } finally {
      audio.uninstall()
    }
  })
})
