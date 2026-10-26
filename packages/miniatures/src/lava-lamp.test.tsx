import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { lavaLamp, MiniatureLavaLamp, type MiniatureLavaLampKey } from './lava-lamp'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureLavaLamp, lavaLamp)

describe('Lava lamp', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it (reduced motion by default: no flow, state changes jump), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureLavaLampKey[] = [], { reduced = true, settle = 200 } = {}) => {
    const run = useFrames()
    const view = mount(MiniatureLavaLamp, { reducedMotion: reduced ? 'always' : 'never' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    const wax = () => view.svg().querySelector('.wax')!.getAttribute('d')
    const control = (label: string) => view.inside.querySelector(`[aria-label^="${label}"]`)!
    return { ...view, run, wax, control, snap: () => view.handle().getSnapshot() }
  }
  const press = async (view: Awaited<ReturnType<typeof play>>, key: MiniatureLavaLampKey, settle = 100) => {
    act(() => view.handle().press(key))
    await view.run(settle)
  }
  const degrees = (readout: string) => Number(readout.match(/^(\d+) °C/)![1])
  /** How high the wax reaches: the smallest y in its outline (the drawing's y runs down). */
  const crest = (d: string | null) => Math.min(...[...d!.matchAll(/-?\d+\.\d+,(-?\d+\.\d+)/g)].map((m) => Number(m[1])))

  it('stands warm and flowing, as its metadata says, when motion is reduced', async () => {
    const { snap, svg, wax } = await play()
    expect(snap()).toEqual(lavaLamp.initial)
    expect(svg()).toHaveClass('lit', 'p0')
    expect(wax()).toMatch(/^M[\d.,-]+C/)
  })

  it('draws the wax as smooth closed curves that stay inside the glass', async () => {
    const { wax, run } = await play([], { reduced: false })
    for (let i = 0; i < 4; i++) {
      await run(700)
      const d = wax()!
      expect(d).not.toMatch(/L/)
      expect(d.match(/M/g)!.length).toBe(d.match(/Z/g)!.length)
      const xy = d.match(/-?\d+(?:\.\d+)?/g)!.map(Number)
      for (let k = 0; k < xy.length; k += 2) {
        expect(Math.abs(xy[k]!)).toBeLessThan(24)
        expect(xy[k + 1]!).toBeGreaterThan(-124)
        expect(xy[k + 1]!).toBeLessThan(-38)
      }
    }
  })

  it('flows on its own: the wax keeps changing shape', async () => {
    const { wax, run, snap } = await play([], { reduced: false })
    const before = wax()
    await run(1500)
    expect(wax()).not.toBe(before)
    expect(snap()).toEqual(lavaLamp.initial)
  })

  it('holds still with reduced motion: no flow and no flicker', async () => {
    const { wax, run, svg } = await play()
    const before = wax()
    await run(3000)
    expect(wax()).toBe(before)
    expect(svg().querySelector('g')!.innerHTML).toContain('wax')
  })

  it('Space switches it off and on; with reduced motion it jumps between cold and flowing', async () => {
    const view = await play()
    const flowing = view.wax()
    await press(view, ' ')
    expect(view.snap().readout).toBe('21 °C · ASLEEP')
    expect(view.snap().state).toBe('OFF · SPACE TURNS IT ON')
    expect(view.svg()).not.toHaveClass('lit')
    expect(view.control('Switch')).toHaveAttribute('aria-pressed', 'false')
    expect(view.wax()).not.toBe(flowing)
    await press(view, ' ')
    expect(view.snap()).toEqual(lavaLamp.initial)
    expect(view.svg()).toHaveClass('lit')
    expect(view.control('Switch')).toHaveAttribute('aria-pressed', 'true')
    expect(view.wax()).toBe(flowing)
  })

  it('warms up slowly once switched on: waking, then sluggish, then flowing', async () => {
    const view = await play([' '])
    view.rerender(<MiniatureLavaLamp ref={view.ref} reducedMotion="never" />)
    await press(view, ' ')
    expect(view.svg()).toHaveClass('lit')
    expect(view.snap().state).toBe('WARMING UP · RED IN YELLOW')
    expect(view.snap().readout).toMatch(/^2\d °C · WAKING$/)
    const cold = crest(view.wax())
    await view.run(1000)
    expect(Math.abs(crest(view.wax()) - cold)).toBeLessThan(1.5)
    let t = degrees(view.snap().readout)
    await view.run(5000)
    expect(view.snap().readout).toMatch(/ · SLUGGISH$/)
    expect(degrees(view.snap().readout)).toBeGreaterThan(t)
    t = degrees(view.snap().readout)
    await view.run(10000)
    expect(view.snap().readout).toMatch(/ · DREAMY$/)
    expect(view.snap().state).toBe('FLOWING · RED IN YELLOW')
    expect(degrees(view.snap().readout)).toBeGreaterThan(t)
    expect(crest(view.wax())).toBeLessThan(cold - 8)
  })

  it('cools and settles when switched off: the light goes at once, the warmth slowly', async () => {
    const view = await play([' '], { reduced: false })
    expect(view.svg()).not.toHaveClass('lit')
    expect(view.snap().state).toBe('COOLING · RED IN YELLOW')
    expect(view.snap().readout).toMatch(/ · SETTLING$/)
    await view.run(3000)
    expect(degrees(view.snap().readout)).toBeLessThan(55)
    await view.run(32000)
    expect(view.snap().readout).toBe('21 °C · ASLEEP')
    expect(view.snap().state).toBe('OFF · SPACE TURNS IT ON')
    const settled = view.wax()
    await view.run(1000)
    expect(view.wax()).toBe(settled)
  })

  it('→ and ← step through the color pairs and wrap around', async () => {
    const view = await play(['ArrowRight'])
    expect(view.svg()).toHaveClass('p1')
    expect(view.snap().state).toBe('COLORS · WHITE IN BLUE')
    for (const [pair, name] of [
      ['p2', 'PINK IN PURPLE'],
      ['p3', 'ORANGE IN CLEAR'],
      ['p0', 'RED IN YELLOW'],
    ] as const) {
      await press(view, 'ArrowRight')
      expect(view.svg()).toHaveClass(pair)
      expect(view.snap().state).toBe(`COLORS · ${name}`)
    }
    await press(view, 'ArrowLeft')
    expect(view.svg()).toHaveClass('p3')
    await view.run(2000)
    expect(view.snap().state).toBe('FLOWING · ORANGE IN CLEAR')
  })

  it('Enter nudges the flow: the wax swirls, the lamp rocks and the mood is stirred for a while', async () => {
    const view = await play([], { reduced: false })
    await press(view, 'Enter')
    expect(view.snap().readout).toBe('60 °C · STIRRED')
    for (const part of view.svg().querySelectorAll('.rock')) expect(part.getAttribute('transform')).toMatch(/^rotate\(/)
    await view.run(3000)
    expect(view.snap().readout).toBe('60 °C · DREAMY')
  })

  it('with reduced motion a nudge jumps to another picture of the flow, without rocking', async () => {
    const view = await play()
    const first = view.wax()
    act(() => void view.control('Glass').dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await view.run(100)
    expect(view.wax()).not.toBe(first)
    expect(view.snap().readout).toBe('60 °C · STIRRED')
    for (const part of view.svg().querySelectorAll('.rock')) expect(part.getAttribute('transform') ?? '').toBe('')
    await press(view, 'Enter')
    await press(view, 'Enter')
    expect(view.wax()).toBe(first)
  })

  it('cold wax is set: a nudge does not move it', async () => {
    const view = await play([' '])
    const cold = view.wax()
    await press(view, 'Enter')
    expect(view.snap().state).toBe('COLD WAX · SPACE WARMS IT')
    expect(view.snap().readout).toBe('21 °C · ASLEEP')
    expect(view.wax()).toBe(cold)
  })

  it('the switch on the base turns it off and on', async () => {
    const view = await play()
    act(() => void view.control('Switch').dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await view.run(100)
    expect(view.snap().readout).toBe('21 °C · ASLEEP')
    act(() => void view.control('Switch').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
    await view.run(100)
    expect(view.snap()).toEqual(lavaLamp.initial)
  })

  it('redraws in place: the drawing keeps the same number of nodes through play and every interaction', async () => {
    const view = await play([], { reduced: false })
    const nodes = view.svg().querySelectorAll('*').length
    await view.run(3000)
    expect(view.svg().querySelectorAll('*').length).toBe(nodes)
    for (const key of [' ', 'ArrowRight', 'Enter', 'ArrowLeft', ' ', 'Enter'] as const) await press(view, key, 600)
    act(() => void view.control('Glass').dispatchEvent(new MouseEvent('click', { bubbles: true })))
    act(() => void view.control('Switch').dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await view.run(2500)
    expect(view.svg().querySelectorAll('*').length).toBe(nodes)
  })
})
