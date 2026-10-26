import { act, cleanup } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureChemistryBench, type MiniatureChemistryBenchHandle, type MiniatureChemistryBenchKey, chemistryBench } from './chemistry-bench'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureChemistryBench, chemistryBench)

describe('Chemistry bench', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it (reduced motion unless asked: no travel, states jump), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureChemistryBenchKey[] = [], settle = 400, reducedMotion: 'always' | 'never' = 'always') => {
    const run = useFrames()
    const view = mount(MiniatureChemistryBench, { reducedMotion })
    await run(100)
    for (const k of keys) {
      act(() => view.handle().press(k))
      await run(50)
    }
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }
  const yieldOf = (readout: string) => Number(readout.match(/YIELD (\d+)%/)![1])
  const tempOf = (readout: string) => Number(readout.match(/^([\d.]+) °C/)![1])
  /** The beaker's charge: its two color layers' fills. */
  const beaker = (inside: ShadowRoot) => [...inside.querySelectorAll('path.liq')].map((p) => p.getAttribute('fill')).filter(Boolean)
  const click = (inside: ShadowRoot, label: string) => act(() => void (inside.querySelector(`[aria-label^="${label}"]`) as SVGElement).dispatchEvent(new MouseEvent('click', { bubbles: true })))

  it('starts mid-run: the burner lit at heat 3, distilling into a receiver a third full', async () => {
    const { snap } = await play()
    expect(snap()).toEqual(chemistryBench.initial)
  })

  it('distills on its own: drops land and the yield climbs; a full receiver makes way for a new batch', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureChemistryBench)
    await run(4000)
    expect(handle().getSnapshot().state).toBe('DISTILLING · HEAT 3 · BATCH 1')
    expect(yieldOf(handle().getSnapshot().readout)).toBeGreaterThan(34)
    act(() => handle().press('ArrowUp'))
    act(() => handle().press('ArrowUp'))
    await run(16000)
    expect(handle().getSnapshot().state).toMatch(/BATCH 2$/)
    expect(yieldOf(handle().getSnapshot().readout)).toBeLessThan(60)
  })

  it('Space puts the burner out: the charge cools and the drips stop; Space lights it again', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureChemistryBench)
    await run(200)
    act(() => handle().press(' '))
    await run(100)
    expect(handle().getSnapshot().state).toBe('BURNER OUT')
    await run(3000)
    const off = handle().getSnapshot()
    expect(off.state).toBe('BURNER OUT · COOLING')
    expect(tempOf(off.readout)).toBeLessThan(95)
    await run(3000)
    expect(handle().getSnapshot().readout).toMatch(new RegExp(`YIELD ${yieldOf(off.readout)}%$`))
    act(() => handle().press(' '))
    await run(100)
    expect(handle().getSnapshot().state).toBe('BURNER LIT · HEAT 3')
    await run(6000)
    expect(handle().getSnapshot().state).toBe('DISTILLING · HEAT 3 · BATCH 1')
  })

  it('with reduced motion it jumps: out and cold at once, lit and distilling at once', async () => {
    const { handle, run, snap } = await play([' '], 1700)
    expect(snap().state).toBe('STANDBY · SPACE LIGHTS IT')
    expect(snap().readout).toBe('21.0 °C · YIELD 32%')
    act(() => handle().press(' '))
    await run(1700)
    expect(snap()).toEqual(chemistryBench.initial)
  })

  it('the arrows set the heat, between 1 and 5', async () => {
    const { handle, run, snap } = await play(['ArrowUp'])
    expect(snap().state).toBe('HEAT 4')
    act(() => handle().press('ArrowRight'))
    await run(100)
    expect(snap().state).toBe('HEAT 5')
    act(() => handle().press('ArrowUp'))
    await run(100)
    expect(snap().state).toBe('HEAT 5 · FULL')
    for (const k of ['ArrowDown', 'ArrowLeft', 'ArrowDown', 'ArrowDown'] as const) act(() => handle().press(k))
    await run(100)
    expect(snap().state).toBe('HEAT 1')
    act(() => handle().press('ArrowDown'))
    await run(100)
    expect(snap().state).toBe('HEAT 1 · LOWEST')
  })

  it('at heat 1 the charge stays below boiling: the vapor falls back and the drips stop', async () => {
    const { snap } = await play(['ArrowDown', 'ArrowDown'], 1700)
    expect(snap().state).toBe('WARMING · HEAT 1 · BELOW BOILING')
    expect(snap().readout).toBe('88.0 °C · YIELD 32%')
  })

  it('with the burner out the arrows still set the heat, and say how to light it', async () => {
    const { snap } = await play([' ', 'ArrowUp'], 100)
    expect(snap().state).toBe('HEAT 4 · SPACE LIGHTS IT')
  })

  it.each([
    ['1', 'AMBER', 'CRIMSON', 'var(--x1)'],
    ['2', 'COBALT', 'EMERALD', 'var(--x2)'],
    ['3', 'JADE', 'VIOLET', 'var(--x3)'],
    ['4', 'ROSE', 'GOLD', 'var(--x4)'],
  ] as const)('%s pours the %s tube into the beaker: it turns %s', async (key, _tube, result, fill) => {
    const { snap, inside } = await play([key], 100)
    expect(snap().state).toBe(`REACTION · ${result}`)
    expect(beaker(inside)).toContain(fill)
  })

  it('a pour lifts the tube, tips it over the beaker and sets it back to refill; one tube at a time', async () => {
    const { handle, run, snap, inside } = await play([], 100, 'never')
    act(() => handle().press('3'))
    await run(200)
    expect(snap().state).toBe('POURING · JADE')
    act(() => handle().press('1'))
    await run(50)
    expect(snap().state).toBe('POURING · ONE AT A TIME')
    await run(1800)
    expect(snap().state).toBe('REACTION · VIOLET')
    expect(beaker(inside)).toContain('var(--x3)')
    await run(1900)
    act(() => handle().press('3'))
    await run(50)
    expect(snap().state).toBe('JADE TUBE REFILLING')
    await run(1500)
    act(() => handle().press('3'))
    await run(50)
    expect(snap().state).toBe('POURING · JADE')
  })

  it('S spins the stir bar, which slows and comes to rest', async () => {
    const { handle, run, snap, inside } = await play([], 100, 'never')
    const bar = () => inside.querySelector('rect.bar')!.parentElement!.getAttribute('transform')
    const lamp = () => inside.querySelector('circle.lamp')!.getAttribute('class')
    const rest = bar()
    act(() => handle().press('s'))
    await run(100)
    expect(snap().state).toBe('STIRRING · BAR SPINNING')
    await run(1000)
    expect(bar()).not.toBe(rest)
    expect(lamp()).toBe('lamp b')
    const spinning = bar()
    await run(200)
    expect(bar()).not.toBe(spinning)
    await run(4000)
    expect(lamp()).toBe('lamp')
    const still = bar()
    await run(500)
    expect(bar()).toBe(still)
  })

  it('its parts are buttons: the burner, each tube and the stirrer', async () => {
    const { inside, run, snap } = await play()
    const burner = inside.querySelector('[aria-label^="Burner"]')!
    expect(burner).toHaveAttribute('aria-pressed', 'true')
    click(inside, 'Burner')
    await run(200)
    expect(snap().state).toBe('BURNER OUT')
    expect(burner).toHaveAttribute('aria-pressed', 'false')
    click(inside, 'Pour the rose tube')
    await run(100)
    expect(snap().state).toBe('REACTION · GOLD')
    await run(1600)
    click(inside, 'Stir the beaker')
    await run(100)
    expect(snap().state).toBe('STIRRING · BAR SPINNING')
    for (const label of ['Burner: light it or put it out (Space)', 'Pour the amber tube into the beaker (1)', 'Stir the beaker (S)']) {
      const button = inside.querySelector(`[aria-label="${label}"]`)!
      expect(button).toHaveAttribute('role', 'button')
      expect(button).toHaveAttribute('tabindex', '0')
    }
  })

  it('keeps its drawing a fixed size: no node is added or lost while it runs, pours, stirs, heats or finishes', async () => {
    const run = useFrames()
    const { svg, handle, rerender, ref } = mount(MiniatureChemistryBench)
    await run(500)
    const nodes = svg().querySelectorAll('*').length
    const steps: [MiniatureChemistryBenchKey | null, number][] = [
      [null, 3000],
      ['2', 600],
      [null, 1500],
      [null, 3000],
      ['s', 1500],
      ['ArrowUp', 1000],
      ['ArrowUp', 6000],
      [' ', 2000],
      [' ', 3000],
      ['4', 4500],
      ['ArrowDown', 2000],
    ]
    for (const [key, ms] of steps) {
      if (key) act(() => handle().press(key))
      await run(ms)
      expect(svg().querySelectorAll('*').length).toBe(nodes)
    }
    rerender(<MiniatureChemistryBench ref={ref} progress={0.2} />)
    await run(3000)
    rerender(<MiniatureChemistryBench ref={ref} progress={0.6} />)
    await run(3000)
    rerender(<MiniatureChemistryBench ref={ref} progress={0.6} done />)
    await run(6000)
    expect(handle().getSnapshot().state).toBe('COMPLETE · BURNER OUT')
    expect(svg().querySelectorAll('*').length).toBe(nodes)
  })

  it('a progress prop makes it determinate: the distillate fills to it and holds there, refluxing', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureChemistryBench, { reducedMotion: 'always' })
    rerender(<MiniatureChemistryBench ref={ref} reducedMotion="always" progress={0.5} />)
    await run(500)
    expect(handle().getSnapshot().readout).toMatch(/YIELD 50%$/)
    expect(handle().getSnapshot().state).toBe('HOLDING AT 50% · REFLUX')
    rerender(<MiniatureChemistryBench ref={ref} reducedMotion="always" progress={0.75} />)
    await run(500)
    expect(handle().getSnapshot().readout).toMatch(/YIELD 75%$/)
  })

  it('with motion the distillate drips up to the progress', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureChemistryBench, { progress: 0.5 })
    await run(200)
    expect(handle().getSnapshot().state).toBe('DISTILLING TO 50%')
    await run(6000)
    expect(handle().getSnapshot().readout).toMatch(/YIELD 50%$/)
    expect(handle().getSnapshot().state).toBe('HOLDING AT 50% · REFLUX')
    rerender(<MiniatureChemistryBench ref={ref} progress={0.2} />)
    await run(100)
    expect(handle().getSnapshot().state).toBe('NEW RUN · FRESH RECEIVER')
    await run(6000)
    expect(handle().getSnapshot().readout).toMatch(/YIELD 20%$/)
  })

  it('done finishes it: the last drops run in, the burner goes out and it comes to rest', async () => {
    const run = useFrames()
    const { handle, rerender, ref } = mount(MiniatureChemistryBench, { progress: 0.4 })
    await run(300)
    rerender(<MiniatureChemistryBench ref={ref} progress={0.4} done />)
    await run(300)
    expect(handle().getSnapshot().state).toBe('FINISHING · LAST DROPS')
    await run(8000)
    expect(handle().getSnapshot().readout).toMatch(/YIELD 100%$/)
    expect(handle().getSnapshot().state).toBe('COMPLETE · BURNER OUT')
  })

  it('the handle drives it too: setProgress, null for indeterminate again, done', async () => {
    const run = useFrames()
    const ref = createRef<MiniatureChemistryBenchHandle>()
    const { rerender } = mount(MiniatureChemistryBench, { reducedMotion: 'always' })
    rerender(<MiniatureChemistryBench ref={ref} reducedMotion="always" />)
    act(() => ref.current!.setProgress(0.25))
    await run(400)
    expect(ref.current!.getSnapshot().readout).toMatch(/YIELD 25%$/)
    act(() => ref.current!.setProgress(null))
    await run(400)
    expect(ref.current!.getSnapshot().state).toBe('DISTILLING · HEAT 3 · BATCH 1')
    act(() => ref.current!.done())
    await run(400)
    expect(ref.current!.getSnapshot().readout).toMatch(/YIELD 100%$/)
    expect(ref.current!.getSnapshot().state).toBe('COMPLETE · BURNER OUT')
    act(() => ref.current!.setProgress(0.1))
    await run(400)
    expect(ref.current!.getSnapshot().readout).toMatch(/YIELD 10%$/)
    expect(ref.current!.getSnapshot().state).toBe('HOLDING AT 10% · REFLUX')
  })

  it('a still bench is still a progress indicator: progress works without interaction', async () => {
    const run = useFrames()
    const { handle, host } = mount(MiniatureChemistryBench, { interactive: false, autoPlay: false, progress: 0.5, reducedMotion: 'always' })
    expect(host).toHaveAttribute('role', 'img')
    await run(500)
    expect(handle().getSnapshot().readout).toMatch(/YIELD 50%$/)
  })
})
