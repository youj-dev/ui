import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureMechanicalKeyboard, type MiniatureMechanicalKeyboardKey, mechanicalKeyboard } from './mechanical-keyboard'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureMechanicalKeyboard, mechanicalKeyboard)

const letters = mechanicalKeyboard.keys[0].keys
/** Any key, listed in the hints or not, through the handle. */
const tap = (handle: () => { press(key: MiniatureMechanicalKeyboardKey): void }, key: string) => act(() => handle().press(key as MiniatureMechanicalKeyboardKey))

describe('MechanicalKeyboard', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it (still by default: every change jumps to its end), presses the keys in order and lets it settle. */
  const play = async (keys: (MiniatureMechanicalKeyboardKey | string)[] = [], reducedMotion: 'always' | 'never' = 'always') => {
    const run = useFrames()
    const view = mount(MiniatureMechanicalKeyboard, { reducedMotion })
    await run(100)
    for (const k of keys) tap(view.handle, k)
    await run(100)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }
  const cap = (inside: ShadowRoot, id: string) => inside.querySelector(`[data-yj-key="${CSS.escape(id)}"]`)!
  /** How far a keycap has travelled down, in drawing units (0 at rest). */
  const travel = (inside: ShadowRoot, id: string) => Number(cap(inside, id).getAttribute('transform')?.match(/translate\(0 (-?[\d.]+)\)/)?.[1] ?? 0)
  /** A keycap's light, 0 (dark) to 1, read from its skirts. */
  const light = (inside: ShadowRoot, id: string) => {
    const skirt = cap(inside, id).querySelector<SVGElement>('.lf')!
    return skirt.style.visibility === 'visible' ? Number(skirt.style.opacity) : 0
  }
  const fRow = (inside: ShadowRoot) => Array.from({ length: 12 }, (_, i) => light(inside, `F${i + 1}`))
  /** Presses a key and holds it: a keydown on the host, with no keyup. */
  const hold = (host: HTMLElement, key: string, code = key) => act(() => void host.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true })))
  const let_go = (host: HTMLElement, key: string, code = key) => act(() => void host.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true, cancelable: true })))

  it('starts ready at volume 40 with the ripple lighting, caps lock off and every key up', async () => {
    const { snap, inside } = await play()
    expect(snap()).toEqual(mechanicalKeyboard.initial)
    expect(inside.querySelectorAll('[data-yj-key]')).toHaveLength(82)
    expect(inside.querySelectorAll('.cap[transform]')).toHaveLength(0)
    expect(inside.querySelector('.cl')).not.toHaveClass('on')
    expect(inside.querySelector('[role=slider]')).toHaveAttribute('aria-valuenow', '40')
  })

  it.each(letters)('%s presses its own keycap, lights it and types its letter', async (key) => {
    const { handle, inside, run, snap } = await play()
    act(() => handle().press(key))
    await run(40)
    expect(travel(inside, key)).toBeCloseTo(1.7)
    expect(light(inside, key)).toBeGreaterThan(0.5)
    for (const other of letters) if (other !== key) expect(travel(inside, other)).toBe(0)
    await run(100)
    expect(travel(inside, key)).toBe(0)
    expect(light(inside, key)).toBe(0)
    expect(snap()).toEqual({ ...mechanicalKeyboard.initial, state: `“${key.toUpperCase()}”` })
  })

  it('types digits and punctuation on their own keycaps, shifted symbols on the base key', async () => {
    const { handle, inside, run, snap } = await play()
    for (const [key, id] of [['7', '7'], [';', ';'], ['?', '/'], ['!', '1'], ['{', '[']] as const) {
      tap(handle, key)
      await run(30)
      expect(travel(inside, id), key).toBeCloseTo(1.7)
      await run(120)
    }
    expect(snap().state).toBe('“7;?!{” · 80 WPM')
  })

  it('a key held down stays down until it is let go, then springs back past its rest and settles', async () => {
    const { host, inside, run } = await play([], 'never')
    hold(host, 'h', 'KeyH')
    await run(400)
    expect(travel(inside, 'h')).toBeCloseTo(1.7, 1)
    let_go(host, 'h', 'KeyH')
    const path: number[] = []
    for (let i = 0; i < 12; i++) {
      await run(16)
      path.push(travel(inside, 'h'))
    }
    expect(Math.min(...path)).toBeLessThan(-0.1)
    await run(400)
    expect(cap(inside, 'h')).not.toHaveAttribute('transform')
  })

  it('Space presses the space bar, types a space, and the bar rocks on its stabilizer as it comes back', async () => {
    const { handle, inside, run, snap } = await play(['h', 'i', ' '])
    expect(snap().state).toBe('“HI ”')
    act(() => handle().press('space'))
    await run(30)
    expect(travel(inside, 'Space')).toBeCloseTo(1.7)
    const moving = await play([], 'never')
    hold(moving.host, ' ', 'Space')
    await moving.run(100)
    let_go(moving.host, ' ', 'Space')
    await moving.run(60)
    expect(cap(moving.inside, 'Space').getAttribute('transform')).toMatch(/matrix\(1 -?[\d.]+ 0 1/)
    await moving.run(600)
    expect(cap(moving.inside, 'Space')).not.toHaveAttribute('transform')
  })

  it('Caps lock lights its LED and shows in the readout; pressed again it goes out', async () => {
    const { handle, inside, run, snap } = await play(['CapsLock'])
    expect(inside.querySelector('.cl')).toHaveClass('on')
    expect(snap()).toMatchObject({ readout: 'VOL 40 · RIPPLE · CAPS', state: 'CAPS LOCK ON' })
    await run(1500)
    expect(snap().state).toBe(mechanicalKeyboard.initial.state)
    act(() => handle().press('CapsLock'))
    await run(100)
    expect(inside.querySelector('.cl')).not.toHaveClass('on')
    expect(snap()).toEqual({ ...mechanicalKeyboard.initial, state: 'CAPS LOCK OFF' })
  })

  it.each([
    ['ArrowUp', 45, 5],
    ['ArrowDown', 35, 4],
  ] as const)('%s turns the knob to %i and the F-row shows the level', async (key, volume, lit) => {
    const { inside, snap, run } = await play([key])
    const knob = inside.querySelector('[role=slider]')!
    expect(snap().readout).toBe(`VOL ${volume} · RIPPLE`)
    expect(knob).toHaveAttribute('aria-valuenow', String(volume))
    expect(knob.querySelector('.ind')!.parentElement).toHaveAttribute('transform', `rotate(${(-135 + 2.7 * volume).toFixed(2)})`)
    expect(fRow(inside).filter((v) => v > 0.5)).toHaveLength(lit)
    await run(1600)
    expect(fRow(inside).every((v) => v === 0)).toBe(true)
  })

  it('the volume stops at 0 and 100', async () => {
    const { snap } = await play(Array(30).fill('ArrowUp'))
    expect(snap().readout).toBe('VOL 100 · RIPPLE')
    const low = await play(Array(30).fill('ArrowDown'))
    expect(low.snap().readout).toBe('VOL 0 · RIPPLE')
  })

  it('Enter or Space on the focused knob mutes, and turning it unmutes', async () => {
    const { inside, run, snap } = await play()
    const knob = inside.querySelector<SVGElement>('[role=slider]')!
    knob.focus()
    act(() => void knob.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })))
    await run(100)
    expect(snap().readout).toBe('VOL MUTED · RIPPLE')
    expect(knob).toHaveAttribute('aria-valuetext', 'muted')
    expect(fRow(inside).filter((v) => v > 0.5)).toHaveLength(0)
    act(() => void knob.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true })))
    await run(100)
    expect(snap().readout).toBe('VOL 45 · RIPPLE')
  })

  it('the right arrow steps the lighting through ripple, wave, breathe and off; the left arrow steps back', async () => {
    const { handle, inside, run, snap } = await play()
    const lit = () => [...inside.querySelectorAll<SVGElement>('.lf')].filter((s) => s.style.visibility === 'visible').length
    expect(lit()).toBe(0)
    for (const [key, mode] of [['ArrowRight', 'WAVE'], ['ArrowRight', 'BREATHE'], ['ArrowRight', 'OFF'], ['ArrowRight', 'RIPPLE'], ['ArrowLeft', 'OFF']] as const) {
      act(() => handle().press(key))
      await run(200)
      expect(snap().readout).toBe(`VOL 40 · ${mode}`)
      if (mode === 'WAVE' || mode === 'BREATHE') expect(lit()).toBeGreaterThan(70)
    }
    act(() => handle().press('g'))
    await run(30)
    expect(travel(inside, 'g')).toBeCloseTo(1.7)
    expect(light(inside, 'g')).toBe(0)
  })

  it('a ripple spreads from the key pressed: its neighbors light first, the far side of the board later', async () => {
    const { host, inside, run } = await play([], 'never')
    await run(2500)
    hold(host, 'g', 'KeyG')
    await run(32)
    expect(light(inside, 'g')).toBeGreaterThan(0.5)
    expect(light(inside, 'h')).toBeGreaterThan(0.1)
    expect(light(inside, 'ArrowRight')).toBe(0)
    await run(818)
    expect(light(inside, 'h')).toBe(0)
    expect(light(inside, 'ArrowRight')).toBeGreaterThan(0.05)
    expect(light(inside, 'g')).toBeGreaterThan(0.5)
    let_go(host, 'g', 'KeyG')
    await run(2500)
    expect(light(inside, 'g')).toBe(0)
  })

  it('Backspace takes back the last letter and Enter sends the line; typing fast shows the speed', async () => {
    const { handle, run, snap } = await play()
    for (const key of 'hello') {
      tap(handle, key)
      await run(120)
    }
    expect(snap().state).toMatch(/^“HELLO” · \d+ WPM$/)
    tap(handle, 'Backspace')
    await run(100)
    expect(snap().state).toMatch(/^“HELL” · \d+ WPM$/)
    act(() => handle().press('enter'))
    await run(100)
    expect(snap().state).toBe(mechanicalKeyboard.initial.state)
  })

  it('shows a shortcut on its keycaps but leaves it to the page', async () => {
    const { host, inside, run, snap } = await play()
    hold(host, 'Meta', 'MetaLeft')
    const k = new KeyboardEvent('keydown', { key: 'k', code: 'KeyK', metaKey: true, bubbles: true, cancelable: true })
    act(() => void host.dispatchEvent(k))
    await run(30)
    expect(k.defaultPrevented).toBe(false)
    expect(travel(inside, 'MetaLeft')).toBeCloseTo(1.7)
    expect(travel(inside, 'k')).toBeCloseTo(1.7)
    expect(snap().state).toBe(mechanicalKeyboard.initial.state)
    let_go(host, 'Meta', 'MetaLeft')
    await run(200)
    expect(travel(inside, 'k')).toBe(0)
    expect(travel(inside, 'MetaLeft')).toBe(0)
  })

  it('a click on a keycap presses it; a click on fn steps the lighting', async () => {
    const { inside, run, snap } = await play()
    const down = (id: string) => act(() => void cap(inside, id).querySelector('.face.top')!.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true })))
    const up = () => act(() => void window.dispatchEvent(new Event('pointerup')))
    down('q')
    await run(100)
    expect(travel(inside, 'q')).toBeCloseTo(1.7)
    up()
    await run(100)
    expect(travel(inside, 'q')).toBe(0)
    expect(snap().state).toBe('“Q”')
    down('Fn')
    up()
    await run(100)
    expect(snap().readout).toBe('VOL 40 · WAVE')
  })

  it('left alone, it types by itself and gives way to the first key', async () => {
    const { handle, run, snap } = await play([], 'never')
    await run(6500)
    expect(snap().state).toMatch(/ · DEMO$|^DEMO · /)
    act(() => handle().press('z'))
    await run(100)
    expect(snap().state).toBe('“Z”')
  })
})
