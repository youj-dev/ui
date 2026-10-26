import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureRocketLaunchPad, type MiniatureRocketLaunchPadHandle, rocketLaunchPad } from './rocket-launch-pad'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureRocketLaunchPad, rocketLaunchPad)

describe('RocketLaunchPad', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  /** Mounts it (still by default: every change jumps to its end) and lets the first frames run. */
  const pad = async (props: Parameters<typeof mount>[1] = { reducedMotion: 'always' }) => {
    const run = useFrames()
    const view = mount(MiniatureRocketLaunchPad, props)
    await run(100)
    return { ...view, run, snap: () => view.handle().getSnapshot(), press: (key: string) => act(() => view.handle().press(key as never)) }
  }
  /** The rocket's group: what moves when it rolls and flies. */
  const rocket = (inside: ShadowRoot) => inside.querySelector('text.decal')!.parentElement!.parentElement!
  /** Each swing arm's truss, drawn on the arm's side: its plane turns with the arm. */
  const arms = (inside: ShadowRoot) => [...inside.querySelectorAll('.truss')].map((t) => t.parentElement!.getAttribute('transform'))
  /** What the board shows: each card's upper half. */
  const board = (inside: ShadowRoot) => [...inside.querySelectorAll('.digit')].filter((_, i) => i % 4 === 0).map((t) => t.textContent).join('')
  const button = (inside: ShadowRoot, label: RegExp) => [...inside.querySelectorAll('[role=button]')].find((b) => label.test(b.getAttribute('aria-label') ?? ''))!

  it('waits on the pad at T–10, held by both arms, ready to launch', async () => {
    const { snap, inside } = await pad()
    expect(snap()).toEqual(rocketLaunchPad.initial)
    expect(rocket(inside).getAttribute('transform')).toBe('')
    expect(board(inside)).toBe('T–10')
  })

  it('Space counts down from ten: the arms swing away, the deluge sprays, the engines ignite', async () => {
    const { snap, press, run, inside } = await pad()
    const held = arms(inside)
    press('space')
    await run(1500)
    expect(snap()).toEqual({ readout: 'T–09 · ALT 0 M · 0 KM/H', state: 'COUNTDOWN · GO FOR LAUNCH', pressed: {} })
    await run(4000)
    expect(snap()).toMatchObject({ readout: 'T–05 · ALT 0 M · 0 KM/H', state: 'COUNTDOWN · ARMS CLEAR' })
    expect(arms(inside)).not.toEqual(held)
    await run(2000)
    expect(snap().state).toBe('COUNTDOWN · WATER DELUGE ON')
    await run(1000)
    expect(snap()).toMatchObject({ readout: 'T–02 · ALT 0 M · 0 KM/H', state: 'IGNITION · THRUST BUILDING' })
  })

  it('lifts off at zero and climbs out of the frame, its telemetry rising', async () => {
    const { snap, press, run, inside } = await pad()
    press('space')
    await run(10600)
    expect(snap().state).toBe('LIFTOFF · CLEARING THE TOWER')
    expect(rocket(inside).getAttribute('transform')).toMatch(/^translate\(/)
    await run(2500)
    expect(snap().readout).toMatch(/^T\+03 · ALT 4\d M · \d+ KM\/H$/)
    await run(1500)
    expect(snap().state).toBe('ASCENT · PITCHING DOWNRANGE')
    await run(1000)
    expect(snap().state).toBe('PAD CLEAR · VEHICLE IN FLIGHT')
    expect(rocket(inside).style.display).toBe('none')
  })

  it('a fresh rocket rolls back onto the pad, and the arms swing in to hold it', async () => {
    const { snap, press, run, inside } = await pad({ reducedMotion: 'never' })
    press('space')
    await run(19000)
    expect(snap().state).toBe('ROLLOUT · NEXT VEHICLE')
    expect(snap().readout).toBe('T–10 · ALT 0 M · 0 KM/H')
    await run(2000)
    expect(rocket(inside).style.display).toBe('')
    expect(rocket(inside).getAttribute('transform')).toMatch(/^translate\(/)
    await run(3500)
    expect(rocket(inside).getAttribute('transform')).toBe('')
    expect(snap()).toEqual(rocketLaunchPad.initial)
  })

  it('reduced motion jumps between the states: the rocket held in its climb, then a fresh one on the pad', async () => {
    const { snap, press, run, inside } = await pad()
    press('space')
    await run(11000)
    expect(rocket(inside).getAttribute('transform')).toBe('translate(2.00 -56.00) rotate(1.50 0 -24)')
    const flame = inside.querySelector('.fo')!.getAttribute('d')
    await run(500)
    expect(inside.querySelector('.fo')!.getAttribute('d')).toBe(flame)
    await run(7500)
    expect(snap()).toEqual(rocketLaunchPad.initial)
    expect(rocket(inside).getAttribute('transform')).toBe('')
  })

  it('Escape aborts the count: the arms swing back and it waits at T–10 again', async () => {
    const { snap, press, run, inside } = await pad()
    const held = arms(inside)
    press('space')
    await run(5000)
    press('escape')
    await run(200)
    expect(snap()).toEqual({ readout: 'T–10 · ALT 0 M · 0 KM/H', state: 'ABORT · ARMS SWINGING BACK', pressed: {} })
    expect(arms(inside)).toEqual(held)
    await run(2500)
    expect(snap()).toEqual(rocketLaunchPad.initial)
  })

  it('Escape after ignition shuts the engines down, and the rocket stays on the pad', async () => {
    const { snap, press, run, inside } = await pad()
    press('space')
    await run(9000)
    expect(snap().state).toBe('IGNITION · THRUST BUILDING')
    press('escape')
    await run(200)
    expect(snap().state).toBe('ABORT · ENGINES SAFE · ARMS IN')
    await run(6000)
    expect(snap()).toEqual(rocketLaunchPad.initial)
    expect(rocket(inside).getAttribute('transform')).toBe('')
  })

  it('the rocket and the board are buttons: the rocket launches, the board aborts a running count', async () => {
    const { snap, run, inside } = await pad()
    act(() => void button(inside, /^Launch the rocket/).dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(1200)
    expect(snap().state).toBe('COUNTDOWN · GO FOR LAUNCH')
    const board = button(inside, /countdown/)
    expect(board).toHaveAttribute('aria-label', 'Abort the countdown (Esc)')
    act(() => void board.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(200)
    expect(snap().state).toBe('ABORT · ARMS SWINGING BACK')
    expect(board).toHaveAttribute('aria-label', 'Launch (Space)')
  })

  it('a progress prop drives the count down, and at 100% it holds at T–01 for the go', async () => {
    const { snap, run, rerender, ref } = await pad({ reducedMotion: 'always', progress: 0.5 })
    await run(300)
    expect(snap()).toEqual({ readout: 'PROGRESS 50% · T–06', state: 'HOLDING AT T–06 · 50%', pressed: {} })
    rerender(<MiniatureRocketLaunchPad ref={ref} reducedMotion="always" progress={1} />)
    await run(300)
    expect(snap()).toMatchObject({ readout: 'PROGRESS 100% · T–01', state: 'HOLDING · AWAITING GO' })
  })

  it('in motion, the board flips down a step at a time to catch up with the progress', async () => {
    const { snap, run, rerender, ref } = await pad({ reducedMotion: 'never' })
    rerender(<MiniatureRocketLaunchPad ref={ref} reducedMotion="never" progress={0.5} />)
    await run(300)
    expect(snap().state).toMatch(/^COUNTING DOWN TO T–06$/)
    expect(snap().readout).toMatch(/^PROGRESS 50% · T–(09|08|07)$/)
    await run(1500)
    expect(snap()).toMatchObject({ readout: 'PROGRESS 50% · T–06', state: 'HOLDING AT T–06 · 50%' })
  })

  it('done lifts it off: the count runs out, it climbs away and comes to rest in orbit', async () => {
    const { snap, run, rerender, ref } = await pad({ reducedMotion: 'never', progress: 0.4 })
    rerender(<MiniatureRocketLaunchPad ref={ref} reducedMotion="never" progress={0.4} done />)
    await run(300)
    expect(snap()).toMatchObject({ readout: expect.stringMatching(/^PROGRESS 100% · T–0\d$/), state: 'FINISHING · GO FOR LAUNCH' })
    await run(2000)
    expect(snap().state).toBe('IGNITION · THRUST BUILDING')
    await run(8000)
    expect(snap()).toEqual({ readout: 'PROGRESS 100% · IN ORBIT', state: 'COMPLETE · IN ORBIT', pressed: {} })
    await run(20000)
    expect(snap().state).toBe('COMPLETE · IN ORBIT')
  })

  it('the handle drives it too: setProgress, null for fueling, done; a new progress rolls out a fresh rocket', async () => {
    const ref = createRef<MiniatureRocketLaunchPadHandle>()
    const { run, rerender, inside } = await pad()
    rerender(<MiniatureRocketLaunchPad ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.25))
    await run(300)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 25% · T–08')
    expect(inside.querySelectorAll('.seg.a')).toHaveLength(3)
    act(() => ref.current!.setProgress(null))
    await run(300)
    expect(ref.current!.getSnapshot()).toEqual({ readout: 'T–10 · HOLD · FUELING', state: 'FUELING · HOLD AT T–10', pressed: {} })
    // Fueling: propellant runs along both arms and the board's lamps chase.
    expect([...inside.querySelectorAll<SVGElement>('.fuel')].map((f) => f.style.opacity)).toEqual(['1', '1'])
    expect(inside.querySelectorAll('.seg.b').length).toBeGreaterThan(0)
    act(() => ref.current!.done())
    await run(8000)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 100% · IN ORBIT')
    act(() => ref.current!.setProgress(0.5))
    await run(300)
    expect(ref.current!.getSnapshot()).toEqual({ readout: 'PROGRESS 50% · T–06', state: 'HOLDING AT T–06 · 50%', pressed: {} })
  })

  it('P steps the progress by a quarter, round to the start again', async () => {
    const { snap, press, run } = await pad()
    const readouts = []
    for (let i = 0; i < 5; i++) {
      press('p')
      await run(300)
      readouts.push(snap().readout)
    }
    expect(readouts).toEqual(['PROGRESS 25% · T–08', 'PROGRESS 50% · T–06', 'PROGRESS 75% · T–04', 'PROGRESS 100% · T–01', 'PROGRESS 0% · T–10'])
  })

  it('Enter finishes it; Space then rolls out a fresh rocket and the pad is ready', async () => {
    const { snap, press, run } = await pad()
    press('enter')
    await run(9000)
    expect(snap()).toEqual({ readout: 'PROGRESS 100% · IN ORBIT', state: 'COMPLETE · IN ORBIT', pressed: {} })
    press('space')
    await run(300)
    expect(snap()).toEqual(rocketLaunchPad.initial)
  })

  it('Space during a progress count launches from where the board stands', async () => {
    const { snap, press, run } = await pad({ reducedMotion: 'always', progress: 0.5 })
    await run(300)
    press('space')
    await run(1200)
    expect(snap()).toMatchObject({ readout: 'T–05 · ALT 0 M · 0 KM/H', state: 'COUNTDOWN · ARMS CLEAR' })
  })

  it('a still pad is still a loader: progress works without interaction', async () => {
    const { snap, host, run } = await pad({ interactive: false, autoPlay: false, progress: 0.5, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(snap().readout).toBe('PROGRESS 50% · T–06')
  })
})
