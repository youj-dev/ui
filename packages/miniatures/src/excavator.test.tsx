import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { excavator, MiniatureExcavator, type MiniatureExcavatorHandle, type MiniatureExcavatorKey } from './excavator'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureExcavator, excavator)

describe('Excavator', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  /** Mounts it (still by default: every change jumps to its end) and lets the first frames run. */
  const rig = async (props: Parameters<typeof mount>[1] = { reducedMotion: 'always' }) => {
    const run = useFrames()
    const view = mount(MiniatureExcavator, props)
    await run(100)
    return { ...view, run, snap: () => view.handle().getSnapshot(), press: (key: MiniatureExcavatorKey | string) => act(() => view.handle().press(key as MiniatureExcavatorKey)) }
  }
  /** The y values of a path's points: on screen, smaller is higher. */
  const ys = (d: string | null) => [...(d ?? '').matchAll(/-?[\d.]+,(-?[\d.]+)/g)].map((m) => Number(m[1]))
  /** How high the spoil pile stands: the top of its outline. */
  const pileTop = (inside: ShadowRoot) => -Math.min(...ys(inside.querySelector('.mound')!.getAttribute('d')))
  /** How deep the trench is drawn: the lowest point of its floor. */
  const pitFloor = (inside: ShadowRoot) => Math.max(...ys(inside.querySelector('.top.pit')!.getAttribute('d')))
  /** The boom's pose, read from the plate on its side. */
  const boom = (inside: ShadowRoot) => inside.querySelector('.plate')!.parentElement!.getAttribute('transform')
  /** The bucket's outline. */
  const bucket = (inside: ShadowRoot) => inside.querySelector('[aria-label^="Curl"] path:last-of-type')!.getAttribute('d')
  /** Where the cab is: its focus ring follows it round. */
  const cab = (inside: ShadowRoot) => {
    const ring = inside.querySelector('[aria-label^="Sound the horn"] .focus-ring')!
    return [Number(ring.getAttribute('cx')), Number(ring.getAttribute('cy'))]
  }
  const beacon = (inside: ShadowRoot) => inside.querySelector('.bl')!.getAttribute('class')
  /** Samples the state line every `step` ms for `ms`, keeping each change once. */
  const states = async (run: (ms: number) => Promise<void>, snap: () => { state: string }, ms: number, step = 100) => {
    const seen: string[] = []
    for (let t = 0; t < ms; t += step) {
      await run(step)
      if (seen.at(-1) !== snap().state) seen.push(snap().state)
    }
    return seen
  }
  const degrees = (state: string) => Number(state.replace('−', '-').match(/(-?\d+)°$/)?.[1])

  it('waits ready at the trench, with an empty bucket and a small pile', async () => {
    const { snap, inside } = await rig()
    expect(snap()).toEqual(excavator.initial)
    expect(beacon(inside)).toBe('bl')
    expect(inside.querySelector('.mound')!.getAttribute('d')).toMatch(/^M[\d.-]+,[\d.-]+L/)
  })

  it('Space runs a full dig cycle: it bites, scoops, lifts, swings, dumps on the pile and swings back', async () => {
    const { snap, press, run, inside } = await rig()
    const [pile, pit] = [pileTop(inside), pitFloor(inside)]
    press('space')
    const seen = await states(run, snap, 5200)
    expect(seen).toEqual([
      'DIGGING · REACHING OVER THE TRENCH',
      'DIGGING · BUCKET BITING',
      'DIGGING · SCOOPING',
      'LIFTING · BUCKET FULL',
      'SWINGING TO THE PILE',
      'DUMPING ON THE PILE',
      'SWINGING BACK',
      'READY · SPACE TO DIG',
    ])
    expect(snap().readout).toBe('CYCLE 01 · LOAD 0.00 M³')
    expect(pileTop(inside)).toBeGreaterThan(pile)
    expect(pitFloor(inside)).toBeGreaterThan(pit)
  })

  it('carries a load from the scoop to the dump, and the readout shows it', async () => {
    const { snap, press, run } = await rig()
    press('space')
    const loads = new Set<string>()
    for (let t = 0; t < 5200; t += 100) {
      await run(100)
      loads.add(`${snap().state} | ${snap().readout}`)
    }
    expect(loads).toContain('LIFTING · BUCKET FULL | CYCLE 00 · LOAD 0.08 M³')
    expect(loads).toContain('SWINGING TO THE PILE | CYCLE 00 · LOAD 0.08 M³')
    expect(loads).toContain('SWINGING BACK | CYCLE 01 · LOAD 0.00 M³')
  })

  it('↑ and ↓ raise and lower the boom by hand', async () => {
    const { snap, press, run, inside } = await rig()
    const pose = boom(inside)
    press('up')
    await run(100)
    expect(snap().state).toMatch(/^HAND CONTROL · BOOM \d+°$/)
    const up = degrees(snap().state)
    expect(boom(inside)).not.toBe(pose)
    press('up')
    await run(100)
    expect(degrees(snap().state)).toBe(up + 5)
    press('down')
    press('down')
    await run(100)
    expect(degrees(snap().state)).toBe(up - 5)
  })

  it('← and → swing the cab round; W and S work the stick', async () => {
    const { snap, press, run, inside } = await rig()
    const at = cab(inside)
    press('left')
    await run(100)
    expect(snap().state).toBe('HAND CONTROL · SWING 9°')
    expect(cab(inside)).not.toEqual(at)
    press('right')
    press('right')
    await run(100)
    expect(snap().state).toBe('HAND CONTROL · SWING −9°')
    press('w')
    await run(100)
    expect(snap().state).toMatch(/^HAND CONTROL · STICK −\d+°$/)
    const stick = degrees(snap().state)
    press('s')
    press('s')
    await run(100)
    expect(degrees(snap().state)).toBe(stick - 14)
  })

  it('hand control lets go after a few seconds, and the machine waits again', async () => {
    const { snap, press, run } = await rig()
    press('up')
    await run(1000)
    expect(snap().state).toMatch(/^HAND CONTROL/)
    await run(4000)
    expect(snap().state).toBe('READY · SPACE TO DIG')
  })

  it('by hand: lower the bucket into the trench, C scoops; swing over the pile, C dumps it', async () => {
    const { snap, press, run, inside } = await rig()
    const pile = pileTop(inside)
    for (let i = 0; i < 12; i++) press('down')
    await run(100)
    press('c')
    await run(100)
    expect(snap()).toMatchObject({ readout: 'CYCLE 00 · LOAD 0.08 M³', state: 'HAND CONTROL · SCOOPED FROM THE TRENCH' })
    for (let i = 0; i < 4; i++) press('up')
    for (let i = 0; i < 10; i++) press('left')
    await run(100)
    expect(snap().state).toBe('HAND CONTROL · SWING 90°')
    press('c')
    await run(100)
    expect(snap()).toMatchObject({ readout: 'CYCLE 01 · LOAD 0.00 M³', state: 'HAND CONTROL · DUMPED ON THE PILE' })
    expect(pileTop(inside)).toBeGreaterThan(pile)
  })

  it('C curls an empty bucket in the air, and opens it again', async () => {
    const { snap, press, run, inside } = await rig()
    const open = bucket(inside)
    press('c')
    await run(100)
    expect(snap()).toMatchObject({ readout: 'CYCLE 00 · LOAD 0.00 M³', state: 'HAND CONTROL · BUCKET CURLED' })
    expect(bucket(inside)).not.toBe(open)
    press('c')
    await run(100)
    expect(snap().state).toBe('HAND CONTROL · BUCKET OPEN')
  })

  it('H sounds the horn: rings go out from the cab for a moment', async () => {
    const { snap, press, run, inside } = await rig()
    press('h')
    await run(100)
    expect(snap().state).toBe('HORN · STAND CLEAR')
    expect(Number((inside.querySelector('.horn') as SVGElement).style.opacity)).toBeGreaterThan(0)
    await run(1500)
    expect(snap().state).toBe('READY · SPACE TO DIG')
    expect((inside.querySelector('.horn') as SVGElement).style.opacity).toBe('0')
  })

  it('left alone it keeps digging, and backfills the trench once the pile is full', async () => {
    const { snap, run } = await rig({ reducedMotion: 'never' })
    expect(snap().state).toBe('READY · SPACE TO DIG')
    const seen = await states(run, snap, 110_000, 250)
    expect(seen).toContain('DIGGING · BUCKET BITING')
    expect(seen).toContain('DUMPING ON THE PILE')
    expect(seen).toContain('BACKFILLING · BUCKET BITING')
    expect(seen).toContain('BACKFILLING · DUMPING INTO THE PIT')
    expect(seen.indexOf('BACKFILLING · BUCKET BITING')).toBeGreaterThan(seen.indexOf('DUMPING ON THE PILE'))
  })

  it('works in motion: the beacon turns, the house nods on the bite and crumbs fly', async () => {
    const { press, run, inside } = await rig({ reducedMotion: 'never' })
    press('space')
    const lamps = new Set<string | null>()
    let nodded = false
    let crumbs = false
    for (let t = 0; t < 3000; t += 50) {
      await run(50)
      lamps.add(beacon(inside))
      nodded ||= /^translate\(0 /.test(inside.querySelector('.drum-shade')!.parentElement!.getAttribute('transform') ?? '')
      crumbs ||= [...inside.querySelectorAll<SVGElement>('.crumb')].some((c) => c.style.display === '')
    }
    expect(lamps).toEqual(new Set(['bl', 'bl on']))
    expect(nodded).toBe(true)
    expect(crumbs).toBe(true)
  })

  it('reduced motion jumps between the poses: still in between, a steady beacon, no crumbs or puffs', async () => {
    const { press, run, inside } = await rig()
    press('space')
    await run(700)
    const [pose, shape] = [boom(inside), bucket(inside)]
    for (let t = 0; t < 300; t += 50) {
      await run(50)
      expect(boom(inside)).toBe(pose)
      expect(bucket(inside)).toBe(shape)
      expect(beacon(inside)).toBe('bl on')
    }
    await run(3000)
    expect([...inside.querySelectorAll<SVGElement>('.crumb, .puff')].every((n) => n.style.display === 'none')).toBe(true)
    expect(inside.querySelector('.drum-shade')!.parentElement!.getAttribute('transform')).toBe('')
  })

  it('a progress prop makes it a progress indicator: the pile follows it', async () => {
    const { handle, rerender, ref, inside, run } = await rig()
    const pile = pileTop(inside)
    rerender(<MiniatureExcavator ref={ref} reducedMotion="always" progress={0.5} />)
    await run(500)
    expect(handle().getSnapshot()).toMatchObject({ readout: 'PROGRESS 50% · CYCLE 00', state: 'HOLDING AT 50% · ENGINE IDLING' })
    const half = pileTop(inside)
    expect(half).toBeGreaterThan(pile)
    rerender(<MiniatureExcavator ref={ref} reducedMotion="always" progress={0.75} />)
    await run(500)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 75% · CYCLE 00')
    expect(pileTop(inside)).toBeGreaterThan(half)
  })

  it('in motion it digs its way to the progress, then idles', async () => {
    const { handle, rerender, ref, run } = await rig({ reducedMotion: 'never' })
    rerender(<MiniatureExcavator ref={ref} reducedMotion="never" progress={0.25} />)
    await run(300)
    expect(handle().getSnapshot()).toMatchObject({ readout: 'PROGRESS 25% · CYCLE 00' })
    expect(handle().getSnapshot().state).toMatch(/^DIGGING/)
    await run(30_000)
    expect(handle().getSnapshot()).toEqual({ readout: 'PROGRESS 25% · CYCLE 01', state: 'HOLDING AT 25% · ENGINE IDLING', pressed: {} })
  })

  it('done finishes it: the last loads go on the pile, and it parks', async () => {
    const { handle, rerender, ref, run } = await rig({ reducedMotion: 'never', progress: 0.4 })
    await run(300)
    rerender(<MiniatureExcavator ref={ref} reducedMotion="never" progress={0.4} done />)
    await run(300)
    expect(handle().getSnapshot().readout).toMatch(/^PROGRESS 100% · CYCLE \d\d$/)
    const seen = await states(run, () => handle().getSnapshot(), 40_000, 250)
    expect(seen).toContain('PARKING · BUCKET DOWN')
    expect(handle().getSnapshot()).toEqual({ readout: 'PROGRESS 100% · COMPLETE', state: 'COMPLETE · PARKED', pressed: {} })
  })

  it('the handle drives it too: setProgress, null for its own digging again, done', async () => {
    const run = useFrames()
    const ref = createRef<MiniatureExcavatorHandle>()
    const { rerender } = mount(MiniatureExcavator, { reducedMotion: 'always' })
    rerender(<MiniatureExcavator ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.25))
    await run(400)
    expect(ref.current!.getSnapshot().readout).toBe('PROGRESS 25% · CYCLE 00')
    act(() => ref.current!.setProgress(null))
    await run(400)
    expect(ref.current!.getSnapshot()).toMatchObject({ readout: 'CYCLE 00 · LOAD 0.00 M³', state: 'READY · SPACE TO DIG' })
    act(() => ref.current!.done())
    await run(400)
    expect(ref.current!.getSnapshot()).toEqual({ readout: 'PROGRESS 100% · COMPLETE', state: 'COMPLETE · PARKED', pressed: {} })
  })

  it('P steps the progress by a quarter; Enter finishes it', async () => {
    const { snap, press, run } = await rig()
    press('p')
    await run(400)
    expect(snap().readout).toBe('PROGRESS 25% · CYCLE 00')
    press('p')
    await run(400)
    expect(snap().readout).toBe('PROGRESS 50% · CYCLE 00')
    press('enter')
    await run(400)
    expect(snap()).toEqual({ readout: 'PROGRESS 100% · COMPLETE', state: 'COMPLETE · PARKED', pressed: {} })
  })

  it('a still excavator is still a loader: progress works without interaction', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniatureExcavator, { interactive: false, autoPlay: false, progress: 0.5, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(handle().getSnapshot().readout).toBe('PROGRESS 50% · CYCLE 00')
  })

  it('its parts are controls: the undercarriage digs, the cab sounds the horn, the bucket curls', async () => {
    const { snap, run, inside } = await rig()
    const click = (label: RegExp) => act(() => void [...inside.querySelectorAll('[role=button]')].find((b) => label.test(b.getAttribute('aria-label') ?? ''))!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    click(/^Sound the horn/)
    await run(100)
    expect(snap().state).toBe('HORN · STAND CLEAR')
    click(/^Curl or dump/)
    await run(100)
    expect(snap().state).toBe('HAND CONTROL · BUCKET CURLED')
    click(/^Run a dig cycle/)
    await run(100)
    expect(snap().state).toMatch(/^DIGGING/)
  })

  it('draws a fixed set of nodes: nothing is added or left behind over play and every key', async () => {
    const { press, run, inside, rerender, ref } = await rig({ reducedMotion: 'never' })
    const count = () => inside.querySelectorAll('*').length
    const nodes = count()
    for (let t = 0; t < 6; t++) {
      await run(500)
      expect(count()).toBe(nodes)
    }
    for (const hint of excavator.keys)
      for (const key of hint.keys) {
        press(key)
        await run(300)
        expect(count()).toBe(nodes)
      }
    for (const key of ['down', 'down', 'down', 'down', 'c', 'up', 'up', 'left', 'left', 'c', 'h', 'space']) {
      press(key)
      await run(200)
    }
    rerender(<MiniatureExcavator ref={ref} reducedMotion="never" progress={0.6} />)
    await run(8000)
    expect(count()).toBe(nodes)
    rerender(<MiniatureExcavator ref={ref} reducedMotion="always" progress={0.2} />)
    await run(2000)
    expect(count()).toBe(nodes)
  })
})
