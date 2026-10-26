import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureTheremin, type MiniatureThereminKey, theremin } from './theremin'
import { installAudio, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureTheremin, theremin)

describe('Theremin', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  const READY = 'READY · HOVER OR HOLD SPACE'

  /** Mounts it with reduced motion (no glide, no ripples), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureThereminKey[] = [], settle = 100) => {
    const run = useFrames()
    const view = mount(MiniatureTheremin, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  /** A key going down or coming up on the miniature, as a held key does. */
  const key = (host: HTMLElement, k: string, type = 'keydown') => act(() => void host.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true, cancelable: true })))

  /** The drawing reads pointer positions through the svg's screen matrix; here screen and drawing coincide. */
  const pointer = (svg: SVGSVGElement, type: string, [x, y]: readonly [number, number]) => {
    svg.getScreenCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) as DOMMatrix
    act(() => void svg.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true })))
  }
  /** The point on the drawing where the hand is `d` from the rod (at x 12) and `z` high, in the plane it plays in (y 14). */
  const at = (d: number, z: number) => [((12 + d - 14) * Math.sqrt(3)) / 2, (12 + d + 14) / 2 - z] as const

  const click = (inside: ShadowRoot, label: string) => act(() => void (inside.querySelector(`[aria-label="${label}"]`) as SVGElement).dispatchEvent(new MouseEvent('click')))

  it('rests on A4 at volume 60, ready to be played', async () => {
    const { snap } = await play()
    expect(snap().readout).toBe(theremin.initial.readout)
    expect(snap().state).toBe(READY)
    expect(snap().pressed).toEqual(theremin.initial.pressed)
  })

  it.each([
    ['ArrowRight', 'A♯4 · 466 HZ · VOL 60'],
    ['ArrowLeft', 'G♯4 · 415 HZ · VOL 60'],
    ['ArrowUp', 'A4 · 440 HZ · VOL 70'],
    ['ArrowDown', 'A4 · 440 HZ · VOL 50'],
  ] as const)('%s nudges the hand and sounds a short note', async (k, readout) => {
    const { run, snap } = await play([k])
    expect(snap().readout).toBe(readout)
    expect(snap().state).toBe('NOTE · VIBRATO LIGHT')
    await run(600)
    expect(snap().state).toBe(READY)
    expect(snap().readout).toBe(readout)
  })

  it('nudges stop at the ends: C6 at the top of the range, silence at the bottom of the volume', async () => {
    const { snap } = await play([...Array<MiniatureThereminKey>(20).fill('ArrowRight'), ...Array<MiniatureThereminKey>(8).fill('ArrowDown')])
    expect(snap().readout).toBe('C6 · 1047 HZ · VOL 0')
  })

  it('Space holds a note for as long as it is held', async () => {
    const { host, run, snap } = await play()
    key(host, ' ')
    await run(100)
    expect(snap().state).toBe('HOLD · VIBRATO LIGHT')
    await run(2000)
    expect(snap().state).toBe('HOLD · VIBRATO LIGHT')
    key(host, ' ', 'keyup')
    await run(100)
    expect(snap().state).toBe(READY)
    expect(snap().readout).toBe(theremin.initial.readout)
  })

  it('a quick tap of Space still sounds a short note', async () => {
    const { run, snap } = await play([' '])
    expect(snap().state).toBe('HOLD · VIBRATO LIGHT')
    await run(600)
    expect(snap().state).toBe(READY)
  })

  it('Space lifts the hand off the loop when the volume is all the way down', async () => {
    const { handle, run, snap } = await play(Array<MiniatureThereminKey>(6).fill('ArrowDown'))
    expect(snap().readout).toBe('A4 · 440 HZ · VOL 0')
    act(() => handle().press(' '))
    await run(100)
    expect(snap().readout).toBe('A4 · 440 HZ · VOL 60')
  })

  it('V changes the vibrato: wide, off (a pure sine), then light again', async () => {
    const { handle, host, run, snap } = await play(['v'])
    expect(snap().state).toBe('VIBRATO WIDE · 5.6 HZ')
    await run(1500)
    key(host, ' ')
    await run(100)
    expect(snap().state).toBe('HOLD · VIBRATO WIDE')
    key(host, ' ', 'keyup')
    act(() => handle().press('v'))
    await run(100)
    expect(snap().state).toBe('VIBRATO OFF · PURE SINE')
    act(() => handle().press('v'))
    await run(100)
    expect(snap().state).toBe('VIBRATO LIGHT · 5.6 HZ')
  })

  it('M plays a short air by itself, note by note, and comes to rest on A4', async () => {
    const { run, snap } = await play(['m'])
    expect(snap().state).toBe('AIR · PLAYING BY ITSELF')
    expect(snap().readout).toBe('E4 · 330 HZ · VOL 52')
    await run(700)
    expect(snap().readout).toBe('A4 · 440 HZ · VOL 62')
    await run(1200)
    expect(snap().readout).toBe('E5 · 659 HZ · VOL 80')
    await run(4300)
    expect(snap().state).toBe(READY)
    expect(snap().readout).toBe('A4 · 440 HZ · VOL 60')
  })

  it('the pointer is the hand: nearer the rod plays higher, higher above the loop plays louder', async () => {
    const { run, snap, svg } = await play()
    pointer(svg(), 'pointermove', at(40, 120))
    await run(100)
    expect(snap().readout).toBe('D♯5 · 613 HZ · VOL 52')
    expect(snap().state).toBe('PLAYING · VIBRATO LIGHT')
    pointer(svg(), 'pointermove', at(20, 150))
    await run(100)
    expect(snap().readout).toBe('G♯5 · 839 HZ · VOL 83')
    pointer(svg(), 'pointermove', at(100, 100))
    await run(100)
    expect(snap().readout).toBe('A♯3 · 238 HZ · VOL 31')
    act(() => void svg().dispatchEvent(new MouseEvent('pointerleave')))
    await run(100)
    expect(snap().state).toBe(READY)
    expect(snap().readout).toBe('A♯3 · 238 HZ · VOL 31')
  })

  it('down at the loop the hand mutes it, and the rod works from either side', async () => {
    const { run, snap, svg } = await play()
    pointer(svg(), 'pointermove', at(60, 60))
    await run(100)
    expect(snap().state).toBe('MUTED · HAND AT THE LOOP')
    expect(snap().readout).toMatch(/· VOL 0$/)
    pointer(svg(), 'pointermove', at(-20, 130))
    await run(100)
    expect(snap().readout).toBe('G♯5 · 839 HZ · VOL 63')
  })

  it('a hand in the field takes over from the air', async () => {
    const { run, snap, svg } = await play(['m'])
    await run(500)
    pointer(svg(), 'pointermove', at(40, 120))
    await run(100)
    expect(snap().state).toBe('PLAYING · VIBRATO LIGHT')
    expect(snap().readout).toBe('D♯5 · 613 HZ · VOL 52')
  })

  it('its parts are buttons: the rod plays a note, the knob changes the vibrato, the button plays the air', async () => {
    const { inside, run, snap } = await play()
    click(inside, 'Play a note (Space)')
    await run(100)
    expect(snap().state).toBe('NOTE · VIBRATO LIGHT')
    click(inside, 'Vibrato (V)')
    await run(100)
    expect(snap().state).toBe('VIBRATO WIDE · 5.6 HZ')
    await run(1500)
    click(inside, 'Play the air (M)')
    await run(100)
    expect(snap().state).toBe('AIR · PLAYING BY ITSELF')
  })

  it('sounds as a sine gliding to the hand, with a vibrato on its pitch, once sound is on and someone played', async () => {
    const audio = installAudio()
    const Base = window.AudioContext
    const made: { type: string; frequency: { value: number } }[] = []
    window.AudioContext = class extends Base {
      constructor() {
        super()
        const create = this.createOscillator.bind(this)
        this.createOscillator = () => {
          const node = create()
          made.push(node as unknown as (typeof made)[number])
          return node
        }
      }
    }
    try {
      const run = useFrames()
      const { host, handle } = mount(MiniatureTheremin, { sound: true })
      await run(100)
      act(() => void host.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true })))
      act(() => handle().press(' '))
      await run(100)
      expect(audio.created).toHaveLength(1)
      expect(made.map((o) => o.type)).toContain('sine')
      expect(made.some((o) => o.frequency.value === 5.6)).toBe(true)
    } finally {
      audio.uninstall()
    }
  })

  it('under reduced motion the field and the wave hold still between frames', async () => {
    const { inside, run } = await play()
    const look = () => [...inside.querySelectorAll('.ring, .trace')].map((n) => `${n.getAttribute('rx')} ${n.getAttribute('opacity')} ${n.getAttribute('d')}`).join('|')
    const before = look()
    await run(1500)
    expect(look()).toBe(before)
  })

  it('with motion, the rings ripple out from the rod', async () => {
    const run = useFrames()
    const { inside } = mount(MiniatureTheremin)
    await run(200)
    const radii = () => [...inside.querySelectorAll('.ring')].map((n) => n.getAttribute('rx')).join()
    const before = radii()
    await run(700)
    expect(radii()).not.toBe(before)
  })

  it('redraws in place: the drawing does not grow while it plays, ripples, plays the air and answers every key', async () => {
    const run = useFrames()
    const { svg, host, handle, inside } = mount(MiniatureTheremin)
    await run(500)
    const nodes = svg().querySelectorAll('*').length
    act(() => handle().press('m'))
    await run(3000)
    for (const p of [at(40, 120), at(10, 160), at(120, 80), at(-30, 100)]) {
      pointer(svg(), 'pointermove', p)
      await run(200)
    }
    act(() => void svg().dispatchEvent(new MouseEvent('pointerleave')))
    for (const k of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'v', 'v', 'v'] as const) {
      act(() => handle().press(k))
      await run(150)
    }
    key(host, ' ')
    await run(800)
    key(host, ' ', 'keyup')
    for (const label of ['Play a note (Space)', 'Vibrato (V)', 'Play the air (M)']) click(inside, label)
    await run(2500)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
  })
})
