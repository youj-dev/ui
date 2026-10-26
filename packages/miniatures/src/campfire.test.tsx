import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { campfire, MiniatureCampfire, type MiniatureCampfireKey } from './campfire'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureCampfire, campfire)

describe('Campfire and tent', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it with reduced motion (states jump, nothing drifts), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureCampfireKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureCampfire, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot(), said: () => view.inside.querySelector('[role=status]')!.textContent }
  }

  /** The drawing reads pointer positions through the svg's screen matrix; here screen and drawing coincide. */
  const pointer = (target: Element, svg: SVGSVGElement, type: string, x: number, y: number) => {
    svg.getScreenCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) as DOMMatrix
    act(() => void target.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true })))
  }
  /** Drags the stick's tip to a drawing point: (29.44, −5) is over the fire's middle, (27.05, 15.56) its rest on the seat. */
  const drag = (inside: ShadowRoot, svg: SVGSVGElement, x: number, y: number) => {
    const stick = inside.querySelector('[aria-label^="Roasting stick"]')!
    pointer(stick, svg, 'pointerdown', 40, 10)
    pointer(stick, svg, 'pointermove', x, y)
    pointer(stick, svg, 'pointerup', x, y)
    return stick
  }
  const FIRE: [number, number] = [29.44, -5]
  const REST: [number, number] = [27.05, 15.56]
  const temperature = (readout: string) => Number(/(\d+) °C/.exec(readout)![1])
  const opacities = (svg: SVGSVGElement, selector: string) => [...svg.querySelectorAll<SVGElement>(selector)].map((n) => Number(n.style.opacity || 0))

  it('starts as a steady fire with the lantern lit and a raw marshmallow', async () => {
    const { snap } = await play()
    expect(snap().readout).toBe(campfire.initial.readout)
    expect(snap().state).toBe(campfire.initial.state)
    expect(snap().pressed).toEqual({})
  })

  it('Space adds a log: the fire flares, then settles hotter than it was', async () => {
    const { handle, run, snap, said } = await play()
    act(() => handle().press(' '))
    await run(100)
    expect(snap().readout).toBe('FLARING · 1090 °C · FUEL 96%')
    expect(snap().state).toBe('LOG ON · FLARING')
    expect(said()).toBe('A log on the fire. It flares up, then settles.')
    await run(3000)
    expect(snap().readout).toMatch(/^ROARING · \d+ °C · FUEL 94%$/)
    expect(temperature(snap().readout)).toBeGreaterThan(800)
    expect(snap().state).toBe(campfire.initial.state)
  })

  it('a click on the fire adds a log too, and the logs stack up to a full fire', async () => {
    const { inside, run, snap } = await play()
    const fire = inside.querySelector('[aria-label="Campfire: add a log (Space)"]')!
    for (let i = 0; i < 3; i++) act(() => void fire.dispatchEvent(new MouseEvent('click')))
    await run(100)
    expect(snap().readout).toBe('FLARING · 1090 °C · FUEL 100%')
  })

  it('burns down slowly on its own, low and then to embers, and says so', async () => {
    const { run, snap, said } = await play()
    await run(40_000)
    expect(snap().readout).toMatch(/^LOW · /)
    expect(said()).toBe('The fire is burning low.')
    await run(40_000)
    expect(snap().readout).toMatch(/^EMBERS · /)
    expect(said()).toBe('The fire is down to embers. Space adds a log.')
    await run(30_000)
    expect(snap().readout).toBe('EMBERS · 480 °C · FUEL 0%')
  })

  it('a log on the embers brings it back', async () => {
    const { handle, run, snap } = await play()
    await run(110_000)
    act(() => handle().press(' '))
    await run(3000)
    expect(snap().readout).toBe('LOW · 660 °C · FUEL 32%')
  })

  it('L dims the lantern and lights it again; a click on the tent does the same', async () => {
    const { run, snap, inside, svg } = await play(['l'])
    const tent = inside.querySelector('[aria-label="Tent: light or dim the lantern (L)"]')!
    expect(snap().state).toBe('LANTERN DIMMED')
    expect(tent).toHaveAttribute('aria-pressed', 'false')
    expect(opacities(svg(), '.glow-in, .lamp-halo, .fabric')).toEqual([0, 0, 0, 0])
    expect(svg().querySelector('.globe')).not.toHaveClass('lit')
    await run(2000)
    expect(snap().state).toBe('MARSHMALLOW RAW · LANTERN OFF')
    act(() => void tent.dispatchEvent(new MouseEvent('click')))
    await run(100)
    expect(snap().state).toBe('LANTERN LIT')
    expect(tent).toHaveAttribute('aria-pressed', 'true')
    expect(opacities(svg(), '.glow-in')).toEqual([1])
    expect(svg().querySelector('.globe')).toHaveClass('lit')
  })

  it('T holds the marshmallow to the fire: it toasts golden, then brown, then burns; T takes it back', async () => {
    const { handle, run, snap, inside, said } = await play(['t'])
    const stick = inside.querySelector('[aria-label^="Roasting stick"]')!
    expect(stick).toHaveAttribute('aria-pressed', 'true')
    expect(snap().state).toBe('TOASTING · WARMING UP · LANTERN ON')
    await run(6000)
    expect(snap().state).toBe('TOASTING · GOLDEN · LANTERN ON')
    expect(said()).toBe('The marshmallow is golden.')
    await run(8000)
    expect(snap().state).toBe('TOASTING · TOASTED · LANTERN ON')
    await run(9000)
    expect(snap().state).toBe('TOASTING · BURNT · LANTERN ON')
    act(() => handle().press('t'))
    await run(2000)
    expect(stick).toHaveAttribute('aria-pressed', 'false')
    expect(snap().state).toBe('MARSHMALLOW BURNT · LANTERN ON')
    expect(said()).toBe('The marshmallow is back from the fire, burnt.')
  })

  it('M puts a fresh marshmallow on the stick', async () => {
    const { handle, run, snap } = await play(['t'])
    await run(8000)
    act(() => handle().press('t'))
    act(() => handle().press('m'))
    await run(100)
    expect(snap().state).toBe('FRESH MARSHMALLOW')
    await run(2000)
    expect(snap().state).toBe('MARSHMALLOW RAW · LANTERN ON')
  })

  it('a click on the stick toasts, like T', async () => {
    const { inside, run, snap } = await play()
    const stick = inside.querySelector('[aria-label^="Roasting stick"]')!
    act(() => void stick.dispatchEvent(new MouseEvent('click')))
    await run(100)
    expect(stick).toHaveAttribute('aria-pressed', 'true')
    expect(snap().state).toMatch(/^TOASTING · /)
  })

  it('dragged into the flames, the marshmallow catches fire; pulled back, the flame goes out', async () => {
    const { run, snap, inside, svg, said } = await play()
    const stick = drag(inside, svg(), ...FIRE)
    expect(stick).toHaveAttribute('aria-pressed', 'true')
    await run(3000)
    expect(snap().state).toBe('ON FIRE · PULL IT BACK')
    drag(inside, svg(), ...REST)
    await run(100)
    expect(said()).toBe('The flame on the marshmallow went out.')
    expect(stick).toHaveAttribute('aria-pressed', 'false')
    await run(2000)
    expect(snap().state).toBe('MARSHMALLOW BURNT · LANTERN ON')
  })

  it('a drag that ends between rest and the fire leaves the stick there', async () => {
    const { run, snap, inside, svg } = await play()
    // The tip over the ring's front, a little out from the flames.
    drag(inside, svg(), 23.07, 0.18)
    await run(5000)
    expect(snap().state).toBe('TOASTING · GOLDEN · LANTERN ON')
  })

  it('with reduced motion it keeps still: no sparks fly and the flames hold their shape', async () => {
    const { svg, run } = await play([' '])
    expect(opacities(svg(), '.spark').every((o) => o === 0)).toBe(true)
    const flames = [...svg().querySelectorAll('.tongue.o')].map((n) => n.getAttribute('d'))
    await run(1000)
    expect([...svg().querySelectorAll('.tongue.o')].map((n) => n.getAttribute('d'))).toEqual(flames)
    expect(opacities(svg(), '.spark').every((o) => o === 0)).toBe(true)
  })

  it('in full motion the flames flicker and sparks rise', async () => {
    const run = useFrames()
    const { svg } = mount(MiniatureCampfire)
    await run(200)
    const before = svg().querySelector('.tongue.o')!.getAttribute('d')
    await run(100)
    expect(svg().querySelector('.tongue.o')!.getAttribute('d')).not.toBe(before)
    await run(1500)
    expect(opacities(svg(), '.spark').some((o) => o > 0)).toBe(true)
  })

  it('keeps its drawing a fixed size through a few seconds of play and every interaction', async () => {
    const run = useFrames()
    const { svg, handle, inside } = mount(MiniatureCampfire)
    await run(500)
    const nodes = svg().querySelectorAll('*').length
    await run(3000)
    expect(svg().querySelectorAll('*')).toHaveLength(nodes)
    for (const key of [' ', 'l', 't', 'm', ' ', ' ', 'l', 't'] as const) {
      act(() => handle().press(key))
      await run(700)
      expect(svg().querySelectorAll('*')).toHaveLength(nodes)
    }
    drag(inside, svg(), ...FIRE)
    await run(4000)
    expect(svg().querySelectorAll('*')).toHaveLength(nodes)
    drag(inside, svg(), ...REST)
    for (const label of ['Tent: light or dim the lantern (L)', 'Campfire: add a log (Space)']) act(() => void inside.querySelector(`[aria-label="${label}"]`)!.dispatchEvent(new MouseEvent('click')))
    await run(3000)
    expect(svg().querySelectorAll('*')).toHaveLength(nodes)
  })
})
