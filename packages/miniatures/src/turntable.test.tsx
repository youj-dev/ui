import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'
import { MiniatureTurntable, type MiniatureTurntableHandle, type MiniatureTurntableKey, turntable } from './turntable'

describeMiniature(MiniatureTurntable, turntable)

const key = (target: EventTarget, k: string) => act(() => void target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true })))

describe('Turntable', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('plays by default: rpm, side and time in the readout, the track in the state', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureTurntable)
    await run(400)
    expect(handle().getSnapshot().readout).toMatch(/^33\.3 rpm · A1 · \d\d:\d\d$/)
    expect(handle().getSnapshot().state).toBe('PLAYING · TRACK 1 · LOW SUN')
    expect(handle().getSnapshot().pressed).toEqual({ ' ': true, d: true, r: true })
  })

  it('Space stops it: the platter stops and the arm returns to its rest', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureTurntable, { reducedMotion: 'always' })
    await run(100)
    act(() => handle().press('space'))
    await run(400)
    expect(handle().getSnapshot().pressed[' ']).toBe(false)
    expect(handle().getSnapshot().state).toBe('STOPPED · ARM AT REST')
    expect(handle().getSnapshot().readout).toMatch(/^0\.0 rpm/)
  })

  it('stops with inertia when motion is allowed', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureTurntable)
    await run(100)
    act(() => handle().press(' '))
    await run(300)
    expect(handle().getSnapshot().state).toBe('STOPPING · PLATTER COASTING')
    expect(parseFloat(handle().getSnapshot().readout)).toBeGreaterThan(20)
  })

  it('4 and 3 switch the speed', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureTurntable, { reducedMotion: 'always' })
    act(() => handle().press('4'))
    await run(300)
    expect(handle().getSnapshot().readout).toMatch(/^45\.0 rpm/)
    act(() => handle().press('3'))
    await run(300)
    expect(handle().getSnapshot().readout).toMatch(/^33\.3 rpm/)
  })

  it('the arrows set the pitch and 0 resets it', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureTurntable, { reducedMotion: 'always' })
    act(() => handle().press('up'))
    act(() => handle().press('ArrowUp'))
    await run(200)
    expect(handle().getSnapshot().state).toBe('PITCH +1.0%')
    expect(handle().getSnapshot().readout).toMatch(/^33\.7 rpm/)
    expect(inside.querySelector('[role=slider]')).toHaveAttribute('aria-valuenow', '1')
    act(() => handle().press('0'))
    await run(200)
    expect(handle().getSnapshot().state).toBe('PITCH RESET · QUARTZ LOCK')
    expect(inside.querySelector('[role=slider]')).toHaveAttribute('aria-valuenow', '0')
  })

  it('D closes and opens the dust cover; its control says which', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureTurntable)
    const lid = inside.getElementById('lid')!
    expect(lid).toHaveAttribute('aria-label', 'Close the dust cover (D)')
    act(() => handle().press('d'))
    await run(50)
    expect(handle().getSnapshot().pressed.d).toBe(false)
    expect(lid).toHaveAttribute('aria-label', 'Open the dust cover (D)')
    act(() => handle().press('d'))
    expect(handle().getSnapshot().pressed.d).toBe(true)
  })

  it('a focused part takes Enter itself: the cover control toggles the cover', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureTurntable)
    const lid = inside.getElementById('lid')!
    act(() => lid.focus())
    key(lid, 'Enter')
    await run(50)
    expect(handle().getSnapshot().pressed.d).toBe(false)
  })

  describe('keys on the page', () => {
    it('scoped (default): reach it only while it is hovered and nothing else has focus', async () => {
      const run = useFrames()
      const { handle, host } = mount(MiniatureTurntable)
      key(document.body, 'r')
      await run(50)
      expect(handle().getSnapshot().pressed.r).toBe(true)
      act(() => void host.dispatchEvent(new Event('pointerenter')))
      key(document.body, 'r')
      await run(50)
      expect(handle().getSnapshot().pressed.r).toBe(false)
      act(() => void host.dispatchEvent(new Event('pointerleave')))
      key(document.body, 'r')
      expect(handle().getSnapshot().pressed.r).toBe(false)
    })

    it('scoped: focus inside it is enough', async () => {
      const run = useFrames()
      const { handle, host } = mount(MiniatureTurntable)
      act(() => host.focus())
      key(host, 'r')
      await run(50)
      expect(handle().getSnapshot().pressed.r).toBe(false)
    })

    it('global: anywhere but a text field or another control’s own key', async () => {
      const run = useFrames()
      const button = document.body.appendChild(document.createElement('button'))
      const { handle } = mount(MiniatureTurntable, { keyboard: 'global' })
      key(document.body, 'r')
      await run(50)
      expect(handle().getSnapshot().pressed.r).toBe(false)
      key(button, ' ')
      await run(50)
      expect(handle().getSnapshot().pressed[' ']).toBe(true)
      button.remove()
    })

    it('off: no shortcuts, though press() still drives it', async () => {
      const run = useFrames()
      const { handle, host } = mount(MiniatureTurntable, { keyboard: 'off' })
      expect(host).not.toHaveAttribute('aria-keyshortcuts')
      act(() => host.focus())
      key(host, 'r')
      await run(50)
      expect(handle().getSnapshot().pressed.r).toBe(true)
      act(() => handle().press('r'))
      expect(handle().getSnapshot().pressed.r).toBe(false)
    })
  })

  it('types its keys: press() takes the ones it lists, or a key name', () => {
    expectTypeOf<MiniatureTurntableKey>().toEqualTypeOf<' ' | '3' | '4' | 'c' | 'd' | 'ArrowUp' | 'ArrowDown' | '0' | 'r'>()
    expectTypeOf<Parameters<MiniatureTurntableHandle['press']>[0]>().toEqualTypeOf<MiniatureTurntableKey | 'space' | 'enter' | 'escape' | 'up' | 'down' | 'left' | 'right'>()
  })

  it('lists its keys for assistive tech', () => {
    const { host } = mount(MiniatureTurntable)
    expect(host).toHaveAttribute('aria-keyshortcuts', 'Space 3 4 C D ArrowUp ArrowDown 0 R')
    const about = document.getElementById(host.getAttribute('aria-describedby')!)
    expect(about?.textContent).toContain('Keys: Space start / stop; 3 4 33 / 45;')
  })

  it('autoPlay false: its first frame, then still until someone interacts', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniatureTurntable, { autoPlay: false })
    await run(200)
    const first = handle().getSnapshot().readout
    expect(first).toMatch(/^33\.3 rpm/)
    await run(2000)
    expect(handle().getSnapshot().readout).toBe(first)
    act(() => void host.dispatchEvent(new Event('pointerdown')))
    await run(3000)
    expect(handle().getSnapshot().readout).not.toBe(first)
  })

  it('pause() holds the clock and play() lets it run', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureTurntable)
    await run(200)
    act(() => handle().pause())
    const held = handle().getSnapshot().readout
    await run(3000)
    expect(handle().getSnapshot().readout).toBe(held)
    act(() => handle().play())
    await run(3000)
    expect(handle().getSnapshot().readout).not.toBe(held)
  })
})
