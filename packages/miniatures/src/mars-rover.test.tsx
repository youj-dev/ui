import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureMarsRover, type MiniatureMarsRoverKey, marsRover } from './mars-rover'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureMarsRover, marsRover)

describe('Mars rover', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it (with reduced motion by default: every change lands at once), presses the keys in order and lets it settle. */
  const rover = async (keys: MiniatureMarsRoverKey[] = [], settle = 100, props: Parameters<typeof mount>[1] = { reducedMotion: 'always' }) => {
    const run = useFrames()
    const view = mount(MiniatureMarsRover, props)
    await run(100)
    for (const k of keys) {
      act(() => view.handle().press(k))
      await run(50)
    }
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot(), press: (k: MiniatureMarsRoverKey) => act(() => view.handle().press(k)) }
  }
  /** Where each rock stands: its group's translation. */
  const rocks = (inside: ShadowRoot) => [...inside.querySelectorAll('path.top.rock')].map((p) => p.parentElement!.getAttribute('transform'))
  /** Which way each wheel's axle points: the plane of its outer face (the matrix without its translation) turns as it steers. */
  const axles = (inside: ShadowRoot) => [...inside.querySelectorAll('path.tread')].map((p) => p.parentElement!.lastElementChild!.getAttribute('transform')!.split(' ').slice(0, 4).join(' '))
  /** The flank, which carries the brand plate: its plane follows the body as the suspension tilts it. */
  const flank = (inside: ShadowRoot) => inside.querySelector('text')!.parentElement!.getAttribute('transform')
  /** The mast head's front, with the stereo eyes. */
  const eyes = (inside: ShadowRoot) => [...inside.querySelectorAll('circle.lensg')].find((c) => c.getAttribute('r') === '2.1')!.parentElement!.getAttribute('transform')
  const opacity = (inside: ShadowRoot, selector: string) => Math.max(...[...inside.querySelectorAll<SVGElement>(selector)].map((n) => Number(n.style.opacity || 0)))
  const pointer = (svg: SVGSVGElement, type: string, x: number, y: number) => {
    svg.getScreenCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) as DOMMatrix
    act(() => void svg.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true })))
  }

  it('waits on its patch of ground, arm stowed, when motion is reduced', async () => {
    const { snap } = await rover([], 1000)
    expect(snap()).toEqual(marsRover.initial)
  })

  it('↑ drives a meter forward: the odometer counts it and the rocks roll back under the wheels', async () => {
    const { snap, inside, press, run } = await rover()
    const before = rocks(inside)
    press('ArrowUp')
    await run(100)
    expect(snap().readout).toBe('SOL 214 · 1 M · 0 SAMPLES · 0 FRAMES')
    expect(snap().state).toBe('DROVE · 1 M FORWARD')
    expect(rocks(inside)).not.toEqual(before)
  })

  it('↓ backs up a meter, and the odometer counts distance either way', async () => {
    const { snap, press, run } = await rover(['ArrowDown'])
    expect(snap().state).toBe('DROVE · 1 M BACK')
    expect(snap().readout).toBe('SOL 214 · 1 M · 0 SAMPLES · 0 FRAMES')
    press('ArrowUp')
    await run(100)
    expect(snap().readout).toBe('SOL 214 · 2 M · 0 SAMPLES · 0 FRAMES')
  })

  it('← and → turn it on the spot: the ground swings around it and the odometer stays', async () => {
    const { snap, inside, press, run } = await rover()
    const before = rocks(inside)
    press('ArrowLeft')
    await run(100)
    expect(snap().state).toBe('TURNED · 15° LEFT')
    expect(rocks(inside)).not.toEqual(before)
    press('ArrowRight')
    await run(100)
    expect(snap().state).toBe('TURNED · 15° RIGHT')
    expect(rocks(inside)).toEqual(before)
    expect(snap().readout).toBe(marsRover.initial.readout)
  })

  it('a sol goes by every 25 meters', async () => {
    const { snap, press, run } = await rover()
    for (let i = 0; i < 25; i++) press('ArrowUp')
    await run(100)
    expect(snap().readout).toBe('SOL 215 · 25 M · 0 SAMPLES · 0 FRAMES')
  })

  it('drives with the wheels straight, climbing over rocks on its rocker-bogie', async () => {
    const { snap, inside, press, run } = await rover([], 100, {})
    const straight = axles(inside)
    const level = flank(inside)
    press('ArrowUp')
    await run(400)
    expect(snap().state).toBe('DRIVING · FORWARD · CLIMBING')
    expect(axles(inside)).toEqual(straight)
    await run(1600)
    expect(snap().readout).toBe('SOL 214 · 1 M · 0 SAMPLES · 0 FRAMES')
    expect(snap().state).toBe('READY · ARM STOWED')
    expect(flank(inside)).not.toBe(level)
  })

  it('reverses a meter in full motion, easing in and out', async () => {
    const { snap, press, run } = await rover([], 100, {})
    press('ArrowDown')
    await run(400)
    expect(snap().state).toMatch(/^DRIVING · REVERSE/)
    await run(1600)
    expect(snap().readout).toBe('SOL 214 · 1 M · 0 SAMPLES · 0 FRAMES')
    expect(snap().state).toBe('READY · ARM STOWED')
  })

  it('steers its corner wheels in for a point turn, then straightens them', async () => {
    const { snap, inside, press, run } = await rover([], 100, {})
    const straight = axles(inside)
    press('ArrowLeft')
    await run(500)
    expect(snap().state).toBe('POINT TURN · LEFT')
    const steered = axles(inside)
    expect(steered.filter((d, i) => d !== straight[i])).toHaveLength(4)
    await run(1500)
    expect(snap().state).toBe('READY · ARM STOWED')
    expect(axles(inside)).toEqual(straight)
  })

  it('Space unfolds the arm to the nearest rock, cores it in a puff of dust and stows it', async () => {
    const { snap, inside, press, run } = await rover()
    expect(inside.querySelectorAll('.hole.on')).toHaveLength(0)
    press(' ')
    await run(300)
    expect(snap().state).toBe('DRILLING · ROCK')
    expect(opacity(inside, 'circle.puff')).toBeGreaterThan(0.5)
    await run(1000)
    expect(snap().readout).toBe('SOL 214 · 0 M · 1 SAMPLE · 0 FRAMES')
    expect(snap().state).toBe('SAMPLE 01 · CACHED')
    expect(inside.querySelectorAll('.hole.on')).toHaveLength(1)
    expect(opacity(inside, 'circle.puff')).toBe(0)
  })

  it('cores each rock once: the next sample takes another', async () => {
    const { snap, inside, press, run } = await rover([' '], 1300)
    press(' ')
    await run(1300)
    expect(snap().readout).toBe('SOL 214 · 0 M · 2 SAMPLES · 0 FRAMES')
    expect(inside.querySelectorAll('.hole.on')).toHaveLength(2)
  })

  it('runs the arm through its moves in full motion, and holds the drive while the arm is out', async () => {
    const { snap, press, run } = await rover([], 100, {})
    press(' ')
    await run(300)
    expect(snap().state).toBe('ARM · UNSTOWING')
    press('ArrowUp')
    await run(100)
    expect(snap().state).toBe('ARM OUT · DRIVE HELD')
    await run(2600)
    expect(snap().state).toBe('DRILLING · ROCK')
    await run(3200)
    expect(snap().readout).toBe('SOL 214 · 0 M · 1 SAMPLE · 0 FRAMES')
    await run(2000)
    expect(snap().state).toBe('READY · ARM STOWED')
  })

  it('Space while it drives waits for it to stop, then samples', async () => {
    const { snap, press, run } = await rover([], 100, {})
    press('ArrowUp')
    await run(100)
    press(' ')
    await run(100)
    expect(snap().state).toBe('SAMPLE NEXT · STOPPING FIRST')
    await run(1600)
    expect(snap().state).toMatch(/^ARM · /)
  })

  it('P sweeps the mast for a panorama, fires the flash and counts the frame', async () => {
    const { snap, inside, press, run } = await rover([], 100, {})
    const home = eyes(inside)
    press('p')
    await run(1200)
    expect(snap().state).toBe('PANORAMA · SWEEPING')
    expect(eyes(inside)).not.toBe(home)
    await run(1200)
    expect(snap().readout).toBe('SOL 214 · 0 M · 0 SAMPLES · 1 FRAME')
    expect(snap().state).toBe('PANORAMA · FRAME 01')
    expect(opacity(inside, 'circle.flash')).toBeGreaterThan(0)
    await run(1000)
    expect(opacity(inside, 'circle.flash')).toBe(0)
  })

  it('with reduced motion a panorama counts its frame without a sweep or a flash', async () => {
    const { snap, inside, press, run } = await rover(['p'])
    expect(snap().readout).toBe('SOL 214 · 0 M · 0 SAMPLES · 1 FRAME')
    expect(snap().state).toBe('PANORAMA · FRAME 01')
    expect(opacity(inside, 'circle.flash')).toBe(0)
    press('p')
    await run(2000)
    press('p')
    await run(100)
    expect(snap().state).toBe('PANORAMA · FRAME 02')
  })

  it('turns its mast head to follow the pointer, and looks back home when the pointer leaves', async () => {
    const { snap, inside, run, svg } = await rover()
    const home = eyes(inside)
    pointer(svg(), 'pointermove', 80, 40)
    await run(100)
    expect(snap().state).toBe('READY · MAST TRACKING')
    const right = eyes(inside)
    expect(right).not.toBe(home)
    pointer(svg(), 'pointermove', -80, 40)
    await run(100)
    expect(eyes(inside)).not.toBe(right)
    act(() => void svg().dispatchEvent(new MouseEvent('pointerleave')))
    await run(1500)
    expect(snap().state).toBe('READY · ARM STOWED')
    expect(eyes(inside)).toBe(home)
  })

  it('left alone, it drives, samples and looks around by itself', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMarsRover)
    await run(5000)
    expect(handle().getSnapshot().readout).toMatch(/^SOL 214 · 2 M · /)
    await run(8000)
    expect(handle().getSnapshot().readout).toMatch(/· 1 SAMPLE ·/)
  })

  it('with reduced motion nothing moves on its own', async () => {
    const { inside, run } = await rover([], 200)
    const still = inside.querySelector('svg')!.innerHTML
    await run(6000)
    expect(inside.querySelector('svg')!.innerHTML).toBe(still)
  })

  it('its parts are buttons: the mast head takes a panorama, the arm samples', async () => {
    const { inside, run, snap } = await rover()
    act(() => (inside.querySelector('[aria-label="Take a panorama (P)"]') as SVGElement).dispatchEvent(new MouseEvent('click')))
    await run(100)
    expect(snap().state).toBe('PANORAMA · FRAME 01')
    act(() => (inside.querySelector('[aria-label="Sample the nearest rock (Space)"]') as SVGElement).dispatchEvent(new MouseEvent('click')))
    await run(100)
    expect(snap().state).toBe('DRILLING · ROCK')
  })

  it('redraws in place: the drawing keeps its node count through play and every key', async () => {
    const run = useFrames()
    const { svg, handle } = mount(MiniatureMarsRover)
    await run(500)
    const nodes = svg().querySelectorAll('*').length
    await run(3000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
    for (const key of ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', ' ', 'p'] as const) {
      act(() => handle().press(key))
      await run(1500)
      expect(svg().querySelectorAll('*').length).toBe(nodes)
    }
    pointer(svg(), 'pointermove', 60, -20)
    await run(6000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
  })
})
