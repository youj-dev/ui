import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureFerrisWheel, type MiniatureFerrisWheelHandle, type MiniatureFerrisWheelKey, ferrisWheel } from './ferris-wheel'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureFerrisWheel, ferrisWheel)

describe('Ferris wheel', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it with reduced motion (it steps a car at a time and jumps where it goes), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureFerrisWheelKey[] = [], settle = 200) => {
    const run = useFrames()
    const view = mount(MiniatureFerrisWheel, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot(), said: () => view.inside.querySelector('[role=status]')!.textContent }
  }
  const click = (root: ShadowRoot, label: string) =>
    act(() => void (root.querySelector(`[aria-label="${label}"]`) as SVGElement).dispatchEvent(new MouseEvent('click', { bubbles: true })))
  /** Each car's swing, from its transform: the shear a turn about its pin gives the drawing (0 when it hangs plumb). */
  const swings = (root: ShadowRoot) =>
    [...root.querySelectorAll('g[class^="k"]')]
      .filter((g) => g.getAttribute('transform')?.startsWith('matrix'))
      .map((g) => Math.abs(Number(g.getAttribute('transform')!.split(/[( ]/)[3])))

  it('turns on its own: car 7 starts at the top and the next cars come round', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureFerrisWheel)
    await run(100)
    expect(handle().getSnapshot()).toEqual(ferrisWheel.initial)
    await run(5000)
    expect(handle().getSnapshot().readout).toBe('TOP · CAR 09 · 2.0 RPM')
  })

  it('with reduced motion it doesn’t turn: it steps a car at a time', async () => {
    const { run, snap } = await play()
    expect(snap().readout).toBe('TOP · CAR 07 · 2.0 RPM')
    await run(2000)
    expect(snap().readout).toBe('TOP · CAR 07 · 2.0 RPM')
    await run(500)
    expect(snap().readout).toBe('TOP · CAR 08 · 2.0 RPM')
  })

  it('Space stops it, and starts it again', async () => {
    const { handle, run, snap } = await play([' '])
    expect(snap().readout).toBe('TOP · CAR 07 · 0.0 RPM')
    expect(snap().state).toBe('STOPPED · TWINKLE LIGHTS')
    await run(5000)
    expect(snap().readout).toBe('TOP · CAR 07 · 0.0 RPM')
    act(() => handle().press(' '))
    await run(100)
    expect(snap().state).toBe('RUNNING · TWINKLE LIGHTS')
  })

  it('stopping, it coasts to rest and its cars swing, then hang plumb again', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureFerrisWheel)
    await run(500)
    expect(Math.max(...swings(inside))).toBeLessThan(0.002)
    act(() => handle().press(' '))
    await run(300)
    expect(handle().getSnapshot().state).toBe('STOPPING · TWINKLE LIGHTS')
    await run(700)
    expect(Math.max(...swings(inside))).toBeGreaterThan(0.02)
    await run(12000)
    expect(handle().getSnapshot().readout).toMatch(/· 0\.0 RPM$/)
    expect(handle().getSnapshot().state).toBe('STOPPED · TWINKLE LIGHTS')
    expect(Math.max(...swings(inside))).toBeLessThan(0.002)
  })

  it('↑ and ↓ set the speed, from 1 to 4 turns a minute', async () => {
    const { handle, run, snap } = await play(['ArrowUp'])
    expect(snap().readout).toBe('TOP · CAR 07 · 3.0 RPM')
    expect(snap().state).toBe('SPEED 3.0 RPM')
    for (const k of ['ArrowUp', 'ArrowUp'] as const) act(() => handle().press(k))
    await run(100)
    expect(snap().readout).toMatch(/· 4\.0 RPM$/)
    expect(snap().state).toBe('TOP SPEED · 4.0 RPM')
    for (let i = 0; i < 5; i++) act(() => handle().press('ArrowDown'))
    await run(100)
    expect(snap().readout).toMatch(/· 1\.0 RPM$/)
    expect(snap().state).toBe('LOWEST SPEED · 1.0 RPM')
  })

  it('stopped, a new speed waits for Space', async () => {
    const { snap } = await play([' ', 'ArrowUp'])
    expect(snap().state).toBe('SPEED 3.0 RPM · SPACE RUNS IT')
    expect(snap().readout).toMatch(/· 0\.0 RPM$/)
  })

  it('L cycles the lights: twinkle, chase, starburst, rainbow and back', async () => {
    const { handle, run, snap, inside } = await play()
    expect(inside.querySelectorAll('.bulb.off')).toHaveLength(0)
    for (const name of ['CHASE', 'STARBURST', 'RAINBOW', 'TWINKLE']) {
      act(() => handle().press('l'))
      await run(100)
      expect(snap().state).toBe(`LIGHTS · ${name}`)
      if (name === 'CHASE') expect(inside.querySelectorAll('.bulb.off').length).toBeGreaterThan(0)
      if (name === 'RAINBOW') expect(inside.querySelectorAll('.bulb.r3').length).toBeGreaterThan(0)
    }
    act(() => handle().press('l'))
    await run(1800)
    expect(snap().state).toBe('RUNNING · CHASE LIGHTS')
  })

  it('a click on a car sends it round to the platform, where its riders step off; a click there sends it to the top', async () => {
    const { run, snap, inside, said } = await play()
    click(inside, 'Car 5: bring it to the platform')
    await run(100)
    expect(snap().state).toBe('BOARDING · CAR 05 AT THE PLATFORM')
    expect(snap().readout).toBe('TOP · CAR 11 · 0.0 RPM')
    expect(said()).toBe('Car 5: the riders step off.')
    click(inside, 'Car 5: send it to the top')
    await run(100)
    expect(snap().state).toBe('CAR 05 AT THE TOP · SPACE RUNS IT')
    expect(snap().readout).toBe('TOP · CAR 05 · 0.0 RPM')
  })

  it('an empty car boards riders at the platform', async () => {
    const { run, inside, said } = await play()
    click(inside, 'Car 3: bring it to the platform')
    await run(100)
    expect(said()).toMatch(/^Car 3: (a rider boards|two riders board)\.$/)
  })

  it('without reduced motion a car travels round, then settles at the platform', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureFerrisWheel)
    await run(100)
    click(inside, 'Car 4: bring it to the platform')
    await run(300)
    expect(handle().getSnapshot().state).toBe('SENDING CAR 04 TO THE PLATFORM')
    await run(4500)
    expect(handle().getSnapshot().state).toBe('BOARDING · CAR 04 AT THE PLATFORM')
    expect(handle().getSnapshot().readout).toBe('TOP · CAR 10 · 0.0 RPM')
  })

  it('B brings the next car down to the platform, one at a time', async () => {
    const { handle, run, snap } = await play(['b'])
    expect(snap().state).toBe('BOARDING · CAR 02 AT THE PLATFORM')
    act(() => handle().press('b'))
    await run(100)
    expect(snap().state).toBe('BOARDING · CAR 03 AT THE PLATFORM')
    act(() => handle().press(' '))
    await run(100)
    expect(snap().state).toBe('RUNNING · TWINKLE LIGHTS')
  })

  it('its parts are buttons: the hub runs or stops it, the booth brings the next car, a focused car takes Enter', async () => {
    const { run, snap, inside } = await play()
    click(inside, 'Wheel hub: start or stop the wheel (Space)')
    await run(100)
    expect(snap().state).toBe('STOPPED · TWINKLE LIGHTS')
    click(inside, 'Ticket booth: board the next car (B)')
    await run(100)
    expect(snap().state).toBe('BOARDING · CAR 02 AT THE PLATFORM')
    const car = inside.querySelector('[aria-label="Car 9: bring it to the platform"]') as SVGElement
    expect(car).toHaveAttribute('role', 'button')
    act(() => void car.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
    await run(100)
    expect(snap().state).toBe('BOARDING · CAR 09 AT THE PLATFORM')
  })

  it('keeps a fixed drawing: no node is added or lost over seconds of play and every interaction', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniatureFerrisWheel)
    await run(500)
    const nodes = svg().querySelectorAll('*').length
    const tap = (label: string) => () =>
      void (inside.querySelector(`[aria-label="${label}"]`) as SVGElement).dispatchEvent(new MouseEvent('click', { bubbles: true }))
    const steps: (() => void)[] = [
      () => handle().press(' '),
      () => handle().press(' '),
      () => handle().press('ArrowUp'),
      () => handle().press('ArrowDown'),
      ...[0, 1, 2, 3].map(() => () => handle().press('l')),
      () => handle().press('b'),
      tap('Car 6: bring it to the platform'),
      tap('Wheel hub: start or stop the wheel (Space)'),
      tap('Ticket booth: board the next car (B)'),
      () => handle().setProgress(0.6),
      () => handle().done(),
      () => handle().setProgress(null),
    ]
    await run(3000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
    for (const step of steps) {
      act(step)
      await run(1500)
      expect(svg().querySelectorAll('*').length).toBe(nodes)
    }
  })

  it('a progress prop makes it determinate: the wheel turns that far round from car 1 at the platform', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureFerrisWheel, { reducedMotion: 'always' })
    rerender(<MiniatureFerrisWheel ref={ref} reducedMotion="always" progress={0.5} />)
    await run(300)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50% · TOP · CAR 01')
    expect(handle().getSnapshot().state).toBe('PROGRESS · HOLDING AT 50%')
    rerender(<MiniatureFerrisWheel ref={ref} reducedMotion="always" progress={0.75} />)
    await run(300)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 75% · TOP · CAR 04')
  })

  it('without reduced motion it turns to the progress rather than jumping', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureFerrisWheel)
    rerender(<MiniatureFerrisWheel ref={ref} progress={0.25} />)
    await run(300)
    expect(handle().getSnapshot().state).toBe('PROGRESS · TURNING TO 25%')
    expect(handle().getSnapshot().readout).not.toMatch(/^PROGRESS 25%/)
    await run(4000)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 25% · TOP · CAR 10')
    expect(handle().getSnapshot().state).toBe('PROGRESS · HOLDING AT 25%')
  })

  it('done finishes the turn: car 1 comes back to the platform and every light comes on', async () => {
    const run = useFrames()
    const { handle, rerender, ref, inside } = mount(MiniatureFerrisWheel, { progress: 0.4 })
    await run(300)
    rerender(<MiniatureFerrisWheel ref={ref} progress={0.4} done />)
    await run(300)
    expect(handle().getSnapshot().state).toBe('FINISHING · LAST TURN')
    await run(9000)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 100% · COMPLETE')
    expect(handle().getSnapshot().state).toBe('COMPLETE · CAR 01 AT THE PLATFORM')
    await run(3000)
    expect(inside.querySelectorAll('.bulb.off')).toHaveLength(0)
  })

  it('the handle drives it too: setProgress, null runs it again, done', async () => {
    const run = useFrames()
    const ref = createRef<MiniatureFerrisWheelHandle>()
    const { rerender } = mount(MiniatureFerrisWheel, { reducedMotion: 'always' })
    rerender(<MiniatureFerrisWheel ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.25))
    await run(300)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 25% · TOP · CAR 10')
    act(() => ref.current!.setProgress(null))
    await run(300)
    expect(ref.current!.getSnapshot().state).toBe('RUNNING · TWINKLE LIGHTS')
    act(() => ref.current!.done())
    await run(300)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 100% · COMPLETE')
    act(() => ref.current!.setProgress(0.5))
    await run(300)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 50% · TOP · CAR 01')
  })

  it('while it shows a progress the page turns it: Space, the speed, B and the cars leave it be', async () => {
    const run = useFrames()
    const { handle, rerender, ref, inside } = mount(MiniatureFerrisWheel, { reducedMotion: 'always' })
    rerender(<MiniatureFerrisWheel ref={ref} reducedMotion="always" progress={0.5} />)
    await run(300)
    const car = inside.querySelector('[aria-label="Car 2: bring it to the platform"]') as SVGElement
    for (const press of [
      () => handle().press(' '),
      () => handle().press('ArrowUp'),
      () => handle().press('b'),
      () => void car.dispatchEvent(new MouseEvent('click', { bubbles: true })),
    ]) {
      act(press)
      await run(100)
      expect(handle().getSnapshot().readout).toBe('PROGRESS 50% · TOP · CAR 01')
      expect(handle().getSnapshot().state).toBe('PROGRESS · THE PAGE TURNS THE WHEEL')
    }
  })

  it('a still wheel is still a loader: progress works without interaction', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniatureFerrisWheel, { interactive: false, autoPlay: false, progress: 0.5, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50% · TOP · CAR 01')
  })
})
