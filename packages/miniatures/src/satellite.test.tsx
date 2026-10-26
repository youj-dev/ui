import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureSatellite, type MiniatureSatelliteHandle, type MiniatureSatelliteKey, satellite } from './satellite'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureSatellite, satellite)

describe('Satellite', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it with reduced motion (no travel, packets held still), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureSatelliteKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureSatellite, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }
  const ground = (inside: ShadowRoot) => inside.querySelector('.spot')!.parentElement!.getAttribute('transform')
  const visiblePuffs = (inside: ShadowRoot) => [...inside.querySelectorAll<SVGElement>('.puff')].filter((n) => Number(n.style.opacity || 0) > 0).length

  it('rests with its wings out and the link up, when motion is reduced', async () => {
    const { snap, svg } = await play()
    expect(snap().readout).toBe(satellite.initial.readout)
    expect(snap().state).toBe(satellite.initial.state)
    expect(snap().pressed).toEqual(satellite.initial.pressed)
    expect(svg()).not.toHaveClass('prog')
  })

  it('streams on its own: packets run down the beam and back up', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureSatellite)
    await run(300)
    const packet = inside.querySelector('.pkt')!
    const before = packet.getAttribute('cy')
    await run(400)
    expect(packet.getAttribute('cy')).not.toBe(before)
    expect(handle().getSnapshot().readout).toMatch(/^LINK 98% · 12\.\d MB\/S$/)
    expect(handle().getSnapshot().state).toBe('LINK UP · SOLAR POWER')
  })

  it('Space stows the wings against the bus, and on battery the link drops to a beacon', async () => {
    const { snap, inside } = await play([' '])
    expect(snap().readout).toBe('LINK 20% · 0.7 MB/S')
    expect(snap().state).toBe('LINK UP · ON BATTERY')
    expect(inside.querySelector('[aria-label="Deploy or stow the solar wings (Space)"]')).toHaveAttribute('aria-pressed', 'false')
  })

  it('Space again deploys them, panel by panel, back to full power', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureSatellite)
    await run(100)
    act(() => handle().press(' '))
    await run(300)
    expect(handle().getSnapshot().state).toBe('STOWING WINGS')
    await run(3200)
    expect(handle().getSnapshot().state).toBe('LINK UP · ON BATTERY')
    act(() => handle().press(' '))
    await run(300)
    expect(handle().getSnapshot().state).toBe('DEPLOYING WINGS · YOKE')
    await run(700)
    expect(handle().getSnapshot().state).toBe('DEPLOYING WINGS · PANEL 1')
    await run(700)
    expect(handle().getSnapshot().state).toBe('DEPLOYING WINGS · PANEL 2')
    await run(700)
    expect(handle().getSnapshot().state).toBe('DEPLOYING WINGS · PANEL 3')
    await run(800)
    expect(handle().getSnapshot().state).toBe('LINK UP · SOLAR POWER')
    expect(handle().getSnapshot().readout).toMatch(/^LINK 98% · 12\.\d MB\/S$/)
  })

  it.each([
    ['ArrowLeft', 'SLEW · AZ 32° · EL −62°', 'LINK 98% · 12.4 MB/S'],
    ['ArrowRight', 'SLEW · AZ 12° · EL −62°', 'LINK 98% · 12.4 MB/S'],
    ['ArrowUp', 'SLEW · AZ 22° · EL −67°', 'LINK 99% · 12.5 MB/S'],
    ['ArrowDown', 'SLEW · AZ 22° · EL −57°', 'LINK 95% · 12.0 MB/S'],
  ] as const)('%s slews the dish and moves the ground point', async (key, state, readout) => {
    const { snap, inside, handle, run } = await play()
    const before = ground(inside)
    act(() => handle().press(key))
    await run(100)
    expect(snap().state).toBe(state)
    expect(snap().readout).toBe(readout)
    expect(ground(inside)).not.toBe(before)
  })

  it('the dish stops at the edge of its reach', async () => {
    const { snap, handle, run } = await play(['ArrowDown'])
    act(() => handle().press('ArrowDown'))
    await run(100)
    expect(snap().state).toBe('SLEW · AT LIMIT')
    expect(snap().readout).toBe('LINK 95% · 12.0 MB/S')
  })

  /** The drawing reads pointer positions through the svg's screen matrix; here screen and drawing coincide. */
  const pointer = (svg: SVGSVGElement, x: number, y: number, target: Element = svg) => {
    svg.getScreenCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) as DOMMatrix
    act(() => void target.dispatchEvent(new MouseEvent('pointerdown', { clientX: x, clientY: y, bubbles: true })))
  }

  it('a click on the floor aims the beam there', async () => {
    const { snap, svg, inside, run } = await play()
    const before = ground(inside)
    pointer(svg(), 22.8, 27.9)
    await run(100)
    expect(snap().state).toBe('SLEW · AZ 30° · EL −60°')
    expect(snap().readout).toBe('LINK 97% · 12.3 MB/S')
    expect(ground(inside)).not.toBe(before)
  })

  it('beyond the dish\'s reach, a click aims it as far as it goes; a click on a part is the part\'s', async () => {
    const { snap, svg, inside, run } = await play()
    pointer(svg(), 0, -60, inside.querySelector('[aria-label="Fire the thrusters (T)"] .hit')!)
    await run(100)
    expect(snap().state).toBe(satellite.initial.state)
    pointer(svg(), -40, 30)
    await run(100)
    expect(snap().state).toBe('SLEW · AZ 52° · EL −57°')
  })

  it('T fires the thrusters: a puff from every pod, and the burn is logged', async () => {
    const { snap, handle, run, inside } = await play(['t'], 100)
    expect(snap().state).toBe('THRUSTERS · BURN 01')
    expect(visiblePuffs(inside)).toBe(4)
    await run(1600)
    expect(visiblePuffs(inside)).toBe(0)
    expect(snap().state).toBe('LINK UP · SOLAR POWER')
    act(() => handle().press('t'))
    await run(100)
    expect(snap().state).toBe('THRUSTERS · BURN 02')
  })

  it('a progress prop makes it a sync, and the ring at the ground point fills to it', async () => {
    const run = useFrames()
    const { handle, rerender, ref, svg, inside } = mount(MiniatureSatellite, { reducedMotion: 'always' })
    rerender(<MiniatureSatellite ref={ref} reducedMotion="always" progress={0.5} />)
    await run(500)
    expect(handle().getSnapshot().readout).toBe('SYNC 50% · 12.4 MB/S')
    expect(handle().getSnapshot().state).toBe('SYNCING · SOLAR POWER')
    expect(svg()).toHaveClass('prog')
    const half = inside.querySelector('.arc')!.getAttribute('d')!
    rerender(<MiniatureSatellite ref={ref} reducedMotion="always" progress={0.75} />)
    await run(500)
    expect(handle().getSnapshot().readout).toBe('SYNC 75% · 12.4 MB/S')
    expect(inside.querySelector('.arc')!.getAttribute('d')!.length).toBeGreaterThan(half.length)
  })

  it('done finishes it: the last of it runs through and the link goes quiet', async () => {
    const run = useFrames()
    const { handle, rerender, ref, svg } = mount(MiniatureSatellite, { progress: 0.4 })
    await run(300)
    rerender(<MiniatureSatellite ref={ref} progress={0.4} done />)
    await run(300)
    expect(handle().getSnapshot().readout).toMatch(/^SYNC (4\d|5\d|6\d)% · /)
    await run(6000)
    expect(handle().getSnapshot().readout).toBe('SYNC 100% · COMPLETE')
    expect(handle().getSnapshot().state).toBe('SYNC COMPLETE · SOLAR POWER')
    expect(svg()).toHaveClass('fin')
  })

  it('the handle drives it too: setProgress, null for a plain link again, done', async () => {
    const run = useFrames()
    const ref = createRef<MiniatureSatelliteHandle>()
    const { rerender } = mount(MiniatureSatellite, { reducedMotion: 'always' })
    rerender(<MiniatureSatellite ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.25))
    await run(400)
    expect(ref.current!.getSnapshot().readout).toBe('SYNC 25% · 12.4 MB/S')
    act(() => ref.current!.setProgress(null))
    await run(400)
    expect(ref.current!.getSnapshot().readout).toBe('LINK 98% · 12.4 MB/S')
    expect(ref.current!.getSnapshot().state).toBe('LINK UP · SOLAR POWER')
    act(() => ref.current!.done())
    await run(400)
    expect(ref.current!.getSnapshot().readout).toBe('SYNC 100% · COMPLETE')
  })

  it('P steps the sync by a quarter, and after 100% starts over', async () => {
    const { snap, handle, run } = await play(['p'])
    expect(snap().readout).toBe('SYNC 25% · 12.4 MB/S')
    for (const share of [50, 75, 100, 0]) {
      act(() => handle().press('p'))
      await run(400)
      expect(snap().readout).toBe(`SYNC ${share}% · 12.4 MB/S`)
    }
  })

  it('a still satellite is still a progress indicator: progress works without interaction', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniatureSatellite, { interactive: false, autoPlay: false, progress: 0.5, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(handle().getSnapshot().readout).toBe('SYNC 50% · 12.4 MB/S')
  })

  it('its parts are buttons: the wings stow and deploy, the bus fires the thrusters', async () => {
    const { inside, run, snap } = await play()
    const wings = inside.querySelector('[aria-label="Deploy or stow the solar wings (Space)"]') as SVGElement
    act(() => void wings.dispatchEvent(new MouseEvent('click')))
    await run(100)
    expect(snap().state).toBe('LINK UP · ON BATTERY')
    act(() => void wings.dispatchEvent(new MouseEvent('click')))
    await run(100)
    expect(snap().state).toBe('LINK UP · SOLAR POWER')
    act(() => void (inside.querySelector('[aria-label="Fire the thrusters (T)"]') as SVGElement).dispatchEvent(new MouseEvent('click')))
    await run(100)
    expect(snap().state).toBe('THRUSTERS · BURN 01')
  })

  it('redraws in place: the drawing keeps the same nodes through play and every interaction', async () => {
    const run = useFrames()
    const { svg, handle } = mount(MiniatureSatellite)
    await run(500)
    const nodes = svg().querySelectorAll('*').length
    const same = () => expect(svg().querySelectorAll('*').length).toBe(nodes)
    await run(3000)
    same()
    for (const [key, settle] of [
      [' ', 1200],
      [' ', 3600],
      [' ', 3600],
      ['ArrowLeft', 800],
      ['ArrowUp', 800],
      ['ArrowRight', 800],
      ['ArrowDown', 800],
      ['t', 400],
      ['t', 1600],
      ['p', 800],
      ['p', 800],
    ] as const) {
      act(() => handle().press(key))
      await run(settle)
      same()
    }
    act(() => handle().done())
    await run(6000)
    same()
    act(() => handle().setProgress(null))
    await run(1000)
    same()
  })
})
