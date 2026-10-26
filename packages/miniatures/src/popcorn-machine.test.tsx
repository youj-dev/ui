import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniaturePopcornMachine, type MiniaturePopcornMachineHandle, type MiniaturePopcornMachineKey, popcornMachine } from './popcorn-machine'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniaturePopcornMachine, popcornMachine)

describe('Popcorn machine', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  /** Mounts it (reduced motion unless asked otherwise), presses the keys in order and lets it settle past the notes. */
  const play = async (keys: MiniaturePopcornMachineKey[] = [], settle = 2000, reducedMotion: 'always' | 'never' = 'always') => {
    const run = useFrames()
    const view = mount(MiniaturePopcornMachine, { reducedMotion })
    await run(100)
    const press = (list: MiniaturePopcornMachineKey[]) => list.forEach((k) => act(() => view.handle().press(k)))
    press(keys)
    await run(settle)
    return { ...view, run, press, snap: () => view.handle().getSnapshot() }
  }
  /** The readout's numbers: the kettle's temperature, the pops so far and how full the cabinet is. */
  const read = (readout: string) => {
    const m = readout.match(/^KETTLE (\d+)°C · (\d+) POPS · (\d+)% FULL$/)
    expect(m, readout).not.toBeNull()
    return { temp: Number(m![1]), pops: Number(m![2]), full: Number(m![3]) }
  }

  it('rests ready and cold, half full, when motion is reduced', async () => {
    const { snap, inside } = await play([], 400)
    expect(snap()).toEqual(popcornMachine.initial)
    expect(inside.querySelector('[aria-label^="Kettle heat"]')).toHaveAttribute('aria-pressed', 'false')
  })

  it('runs on its own: the kettle heats, the first kernels pop and the heap rises', async () => {
    const { snap } = await play([], 1000, 'never')
    expect(snap().state).toBe('HEATING · OIL WARMING')
    expect(read(snap().readout).temp).toBeGreaterThan(22)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000)
    })
    expect(snap().state).toMatch(/^POPPING/)
    const { pops, full, temp } = read(snap().readout)
    expect(pops).toBeGreaterThan(0)
    expect(full).toBeGreaterThan(55)
    expect(temp).toBeGreaterThan(172)
  })

  it('Space switches the kettle heat on: with motion reduced the whole batch pops at once', async () => {
    const { snap, inside } = await play([' '])
    expect(snap().readout).toBe('KETTLE 205°C · 120 POPS · 77% FULL')
    expect(snap().state).toBe('KETTLE EMPTY · N DROPS A BATCH')
    expect(inside.querySelector('[aria-label^="Kettle heat"]')).toHaveAttribute('aria-pressed', 'true')
  })

  it('Space again switches it off, and the kettle cools', async () => {
    const { snap, press, run } = await play([' '])
    press([' '])
    await run(2000)
    expect(read(snap().readout).temp).toBe(22)
    expect(snap().state).toBe('READY · SPACE HEATS THE KETTLE')
  })

  it('in full motion the heat switch stops the popping and starts it again', async () => {
    const { snap, press, run } = await play([], 6000, 'never')
    press([' '])
    await run(300)
    expect(snap().state).toBe('HEAT OFF · KETTLE COOLING')
    await run(9000)
    const cooled = read(snap().readout)
    expect(cooled.temp).toBeLessThan(172)
    await run(2000)
    expect(read(snap().readout).pops).toBe(cooled.pops)
    press([' '])
    await run(8000)
    expect(read(snap().readout).pops).toBeGreaterThan(cooled.pops)
  })

  it('N drops a new batch: with the heat on it pops straight away', async () => {
    const { snap, press, run } = await play([' '])
    press(['n'])
    await run(2000)
    expect(snap().readout).toBe('KETTLE 205°C · 240 POPS · 99% FULL')
  })

  it('past the brim it overflows: popcorn spills onto the counter and the cabinet settles just under full', async () => {
    const { snap, press, run, inside } = await play([' ', 'n'])
    expect(inside.querySelector('.spill')).toHaveAttribute('d', '')
    press(['n'])
    await run(2000)
    expect(read(snap().readout).full).toBe(92)
    expect(inside.querySelector('.spill')!.getAttribute('d')).not.toBe('')
    press(['s'])
    await run(2000)
    expect(read(snap().readout).full).toBe(80)
    expect(inside.querySelector('.spill')).toHaveAttribute('d', '')
  })

  it('B drizzles butter over the heap', async () => {
    const { snap, press, run, inside } = await play()
    expect(inside.querySelector('.butter')!.getAttribute('style')).toBe('opacity:0.00')
    press(['b'])
    await run(200)
    expect(snap().state).toBe('BUTTER · DRIZZLING')
    expect(inside.querySelector('.butter')!.getAttribute('style')).toBe('opacity:0.85')
  })

  it('S scoops a box, and so does a click on the door', async () => {
    const { snap, inside, run } = await play(['s'], 200)
    expect(snap().state).toBe('SCOOPED · A BOX TO GO')
    expect(read(snap().readout).full).toBe(43)
    act(() => void inside.querySelector('[aria-label^="Cabinet door"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(200)
    expect(read(snap().readout).full).toBe(31)
  })

  it('in full motion the scoop opens the door, digs, fills a fresh box and the door shuts', async () => {
    const { snap, press, run, inside } = await play([' '], 100, 'never')
    const door = inside.querySelector('[aria-label^="Cabinet door"]')!
    const shut = door.getAttribute('transform')
    press(['s'])
    await run(700)
    expect(snap().state).toBe('SCOOPING A BOX')
    expect(door.getAttribute('transform')).not.toBe(shut)
    await run(2200)
    expect(snap().state).toBe('SCOOPED · A BOX TO GO')
    expect(read(snap().readout).full).toBe(43)
    await run(600)
    expect(door.getAttribute('transform')).toBe(shut)
  })

  it('the heap is the progress: a page drives it, and done pops it to the brim and over', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniaturePopcornMachine, { reducedMotion: 'always' })
    rerender(<MiniaturePopcornMachine ref={ref} reducedMotion="always" progress={0.5} />)
    await run(500)
    expect(handle().getSnapshot().readout).toMatch(/· 50% FULL$/)
    expect(handle().getSnapshot().state).toBe('HOLDING AT 50%')
    rerender(<MiniaturePopcornMachine ref={ref} reducedMotion="always" progress={0.75} />)
    await run(500)
    expect(handle().getSnapshot().readout).toMatch(/· 75% FULL$/)
    rerender(<MiniaturePopcornMachine ref={ref} reducedMotion="always" progress={0.75} done />)
    await run(500)
    expect(handle().getSnapshot().readout).toMatch(/· 100% FULL$/)
    expect(handle().getSnapshot().state).toBe('COMPLETE · FRESH POPCORN')
  })

  it('in full motion a progress fills the heap by popping, and done overflows it and comes to rest', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniaturePopcornMachine, { progress: 0.7 })
    await run(300)
    expect(handle().getSnapshot().state).toBe('POPPING TO 70%')
    await run(12000)
    expect(handle().getSnapshot().readout).toMatch(/· 70% FULL$/)
    expect(handle().getSnapshot().state).toBe('HOLDING AT 70%')
    rerender(<MiniaturePopcornMachine ref={ref} progress={0.7} done />)
    await run(300)
    expect(handle().getSnapshot().state).toMatch(/^FINISHING/)
    await run(30000)
    expect(handle().getSnapshot().readout).toMatch(/· 100% FULL$/)
    expect(handle().getSnapshot().state).toBe('COMPLETE · FRESH POPCORN')
  })

  it('done while it serves itself down after a spill pops it back up instead of jumping to full', async () => {
    seedRandom(7)
    const { snap, run, handle } = await play([], 15000, 'never')
    for (let i = 0; i < 80 && !(/^(SERVING|SCOOP)/.test(snap().state) && read(snap().readout).full < 95); i++) await run(500)
    expect(snap().state).toMatch(/^(SERVING|SCOOP)/)
    const before = read(snap().readout).full
    act(() => handle().done())
    await run(100)
    expect(read(snap().readout).full).toBeLessThanOrEqual(before + 3)
    await run(40000)
    expect(snap().state).toBe('COMPLETE · FRESH POPCORN')
    expect(read(snap().readout).full).toBe(100)
  })

  it('the handle drives it too: setProgress, null to run on its own again, done', async () => {
    const run = useFrames()
    const ref = createRef<MiniaturePopcornMachineHandle>()
    const { rerender } = mount(MiniaturePopcornMachine, { reducedMotion: 'always' })
    rerender(<MiniaturePopcornMachine ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.25))
    await run(400)
    expect(ref.current!.getSnapshot().readout).toMatch(/· 25% FULL$/)
    act(() => ref.current!.setProgress(null))
    await run(400)
    expect(ref.current!.getSnapshot().state).toBe('READY · SPACE HEATS THE KETTLE')
    act(() => ref.current!.done())
    await run(400)
    expect(ref.current!.getSnapshot().state).toBe('COMPLETE · FRESH POPCORN')
  })

  it('a still popcorn machine is still a loader: progress works without interaction', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniaturePopcornMachine, { interactive: false, autoPlay: false, progress: 0.5, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(handle().getSnapshot().readout).toMatch(/· 50% FULL$/)
  })

  it('redraws in place: the drawing keeps its node count through play, every key, the door, an overflow and done', async () => {
    const { svg, press, run, inside, handle } = await play([], 500, 'never')
    const nodes = svg().querySelectorAll('*').length
    await run(3000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
    for (const key of ['n', 'b', 's', ' ', ' '] as MiniaturePopcornMachineKey[]) {
      press([key])
      await run(1200)
      expect(svg().querySelectorAll('*').length).toBe(nodes)
    }
    act(() => void inside.querySelector('[aria-label^="Cabinet door"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    await run(3000)
    press(['n', 'n'])
    await run(20000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
    act(() => handle().press('s'))
    await run(1000)
    expect(svg().querySelectorAll('*').length).toBe(nodes)
  })
})
