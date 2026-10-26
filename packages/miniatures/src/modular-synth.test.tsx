import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureModularSynth, type MiniatureModularSynthKey, modularSynth } from './modular-synth'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureModularSynth, modularSynth)

describe('Modular synth', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it (reduced motion unless asked otherwise), presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureModularSynthKey[] = [], { settle = 100, reducedMotion = 'always' }: { settle?: number; reducedMotion?: 'always' | 'never' } = {}) => {
    const run = useFrames()
    const view = mount(MiniatureModularSynth, { reducedMotion })
    await run(100)
    for (const k of keys) {
      act(() => view.handle().press(k))
      await run(20)
    }
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  /** The drawing reads pointer positions through the svg's screen matrix; here screen and drawing coincide. */
  const pointer = (svg: SVGSVGElement, type: string, [x, y]: number[]) => {
    svg.getScreenCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) as DOMMatrix
    act(() => void svg.dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true })))
  }
  /** A jack's control, by the start of its name, and where it is on the drawing. */
  const jack = (inside: ShadowRoot, name: string) => inside.querySelector(`[aria-label^="${name}"]`) as SVGGElement
  const at = (inside: ShadowRoot, name: string) => ['cx', 'cy'].map((a) => Number(jack(inside, name).querySelector('circle')!.getAttribute(a)))
  const drag = (svg: SVGSVGElement, from: number[], to: number[]) => {
    pointer(svg, 'pointerdown', from)
    pointer(svg, 'pointermove', [(from[0]! + to[0]!) / 2, (from[1]! + to[1]!) / 2 + 24])
    pointer(svg, 'pointermove', to)
    pointer(svg, 'pointerup', to)
  }
  const enter = (el: Element) => act(() => void el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })))
  const click = (el: Element) => act(() => void el.dispatchEvent(new MouseEvent('click', { bubbles: true })))

  it('runs from the first frame, patched as a bass voice', async () => {
    const { snap, run } = await play()
    expect(snap()).toEqual(modularSynth.initial)
    await run(600)
    expect(snap().readout).toBe('120 BPM · STEP 3/8 · PATCH BASS')
  })

  it('Space stops the sequencer and runs it again from the first step', async () => {
    const { handle, run, snap, inside } = await play([], { settle: 600 })
    act(() => handle().press(' '))
    await run(100)
    expect(snap().readout).toBe('120 BPM · STEP 1/8 · PATCH BASS')
    expect(snap().state).toBe('STOPPED · VCO → VCF → OUT')
    expect(inside.querySelector('[aria-label="Run or stop the sequencer (Space)"]')).toHaveAttribute('aria-pressed', 'false')
    await run(1000)
    expect(snap().readout).toBe('120 BPM · STEP 1/8 · PATCH BASS')
    act(() => handle().press(' '))
    await run(400)
    expect(snap().state).toBe('RUNNING · VCO → VCF → OUT')
    expect(snap().readout).toBe('120 BPM · STEP 2/8 · PATCH BASS')
  })

  it('the number keys switch steps off and on', async () => {
    const { handle, run, snap, inside } = await play(['3'])
    expect(snap().state).toBe('STEP 3 OFF · E3')
    expect(inside.querySelector('[aria-label="Step 3 (3)"]')).toHaveAttribute('aria-pressed', 'false')
    act(() => handle().press('3'))
    await run(50)
    expect(snap().state).toBe('STEP 3 ON · E3')
    act(() => handle().press('2'))
    await run(50)
    expect(snap().state).toBe('STEP 2 ON · A2')
    expect(inside.querySelector('[aria-label="Step 2 (2)"]')).toHaveAttribute('aria-pressed', 'true')
  })

  it('← and → pick a knob, ↑ and ↓ turn it', async () => {
    const { handle, run, snap } = await play(['ArrowUp'])
    expect(snap().state).toBe('CUTOFF · 60%')
    for (const [key, state] of [
      ['ArrowRight', 'RES · 40%'],
      ['ArrowDown', 'RES · 35%'],
      ['ArrowLeft', 'CUTOFF · 60%'],
      ['ArrowLeft', 'FM · 30%'],
      ['ArrowLeft', 'TUNE · 0 ST'],
      ['ArrowUp', 'TUNE · +1 ST'],
    ] as const) {
      act(() => handle().press(key))
      await run(20)
      expect(snap().state).toBe(state)
    }
  })

  it('the tempo knob sets the readout’s tempo, a step’s knob its note, and a knob stops at its end', async () => {
    const { handle, run, snap } = await play(['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowUp'])
    expect(snap().state).toBe('TEMPO · 124 BPM')
    expect(snap().readout).toMatch(/^124 BPM · /)
    act(() => handle().press('ArrowRight'))
    act(() => handle().press('ArrowUp'))
    await run(20)
    expect(snap().state).toBe('STEP 1 · C3')
    for (let i = 0; i < 2; i++) act(() => handle().press('ArrowLeft'))
    await run(20)
    expect(snap().state).toBe('LEVEL · 80%')
    for (let i = 0; i < 5; i++) act(() => handle().press('ArrowUp'))
    await run(20)
    expect(snap().state).toBe('LEVEL · 100% · TOP')
  })

  it('P steps through the preset patches, each with its own signal path', async () => {
    const { handle, run, snap } = await play(['p'])
    expect(snap().state).toBe('PATCH 2/4 · PLUCK')
    expect(snap().readout).toBe('120 BPM · STEP 1/8 · PATCH PLUCK')
    await run(1700)
    expect(snap().state).toBe('RUNNING · VCO → VCF → OUT')
    for (const [state, path] of [
      ['PATCH 3/4 · WAH', 'VCO → VCF → OUT'],
      ['PATCH 4/4 · ZAP', 'VCO → OUT'],
      ['PATCH 1/4 · BASS', 'VCO → VCF → OUT'],
    ]) {
      act(() => handle().press('p'))
      await run(50)
      expect(snap().state).toBe(state)
      await run(1700)
      expect(snap().state).toBe(`RUNNING · ${path}`)
    }
  })

  it('Backspace pulls every cable, and the output goes quiet', async () => {
    const { handle, run, snap, inside } = await play()
    const lit = () => inside.querySelectorAll('circle.lc.on.g').length
    expect(lit()).toBe(5)
    act(() => handle().press('Backspace'))
    await run(50)
    expect(snap().state).toBe('ALL CABLES OUT')
    expect(snap().readout).toBe('120 BPM · STEP 1/8 · PATCH EMPTY')
    await run(1700)
    expect(snap().state).toBe('RUNNING · NOTHING AT OUT')
    expect(lit()).toBe(2)
    act(() => handle().press('Backspace'))
    await run(50)
    expect(snap().state).toBe('NO CABLES TO PULL')
  })

  it('a drag from one jack to another patches a cable, either way round', async () => {
    const { run, snap, svg, inside } = await play(['Backspace'])
    drag(svg(), at(inside, 'Oscillator saw out'), at(inside, 'Output in'))
    await run(50)
    expect(snap().state).toBe('PATCHED · VCO SAW → OUT IN')
    expect(snap().readout).toBe('120 BPM · STEP 1/8 · PATCH USER')
    expect(jack(inside, 'Oscillator saw out')).toHaveAttribute('aria-label', 'Oscillator saw out, patched to output in')
    drag(svg(), at(inside, 'Filter CV in'), at(inside, 'Envelope out A'))
    await run(50)
    expect(snap().state).toBe('PATCHED · ENV A → VCF CV')
    await run(1700)
    expect(snap().state).toBe('RUNNING · VCO → OUT')
  })

  it('a drag away from a plugged jack pulls the cable; a click shows what it’s patched to', async () => {
    const { run, snap, svg, inside } = await play()
    pointer(svg(), 'pointerdown', at(inside, 'Filter in'))
    pointer(svg(), 'pointerup', at(inside, 'Filter in'))
    await run(50)
    expect(snap().state).toBe('VCF IN ← VCO SAW')
    expect(snap().readout).toBe('120 BPM · STEP 1/8 · PATCH BASS')
    const [x, y] = at(inside, 'Output in')
    drag(svg(), [x!, y!], [x! + 40, y! + 60])
    await run(50)
    expect(snap().state).toBe('UNPLUGGED · VCF OUT')
    expect(snap().readout).toBe('120 BPM · STEP 1/8 · PATCH USER')
    await run(1700)
    expect(snap().state).toBe('RUNNING · NOTHING AT OUT')
  })

  it('patches only an output to a free input', async () => {
    const { run, snap, svg, inside } = await play()
    drag(svg(), at(inside, 'Oscillator square out'), at(inside, 'Filter in'))
    await run(50)
    expect(snap().state).toBe('VCF IN IS IN USE · CABLE OUT')
    drag(svg(), at(inside, 'Oscillator square out'), at(inside, 'Sequencer gate out'))
    await run(50)
    expect(snap().state).toBe('OUTPUT TO OUTPUT · NOT PATCHED')
    drag(svg(), at(inside, 'Filter CV in'), at(inside, 'Oscillator pitch in'))
    await run(50)
    expect(snap().state).toBe('INPUT TO INPUT · NOT PATCHED')
    expect(snap().readout).toMatch(/ · PATCH BASS$/)
  })

  it('patches from the keyboard: Enter on one jack, then on another; a hand-made preset is named', async () => {
    const { run, snap, inside } = await play(['Backspace'])
    enter(jack(inside, 'Sequencer CV out'))
    await run(20)
    expect(snap().state).toBe('CABLE FROM SEQ CV · PICK AN INPUT')
    enter(jack(inside, 'Oscillator pitch in'))
    for (const [a, b] of [
      ['Envelope gate in', 'Sequencer gate out'],
      ['Oscillator saw out', 'Filter in'],
      ['Filter out', 'Output in'],
      ['Envelope out A', 'Output level CV in'],
    ] as const) {
      enter(jack(inside, a))
      enter(jack(inside, b))
    }
    await run(50)
    expect(snap().readout).toBe('120 BPM · STEP 1/8 · PATCH BASS')
  })

  it('Enter on a plugged jack lifts its cable, Escape puts it back', async () => {
    const { handle, run, snap, inside } = await play()
    enter(jack(inside, 'Filter in'))
    await run(20)
    expect(snap().state).toBe('CABLE FROM VCO SAW · PICK AN INPUT')
    expect(snap().readout).toMatch(/ · PATCH USER$/)
    act(() => handle().press('escape'))
    await run(20)
    expect(snap().readout).toMatch(/ · PATCH BASS$/)
    expect(jack(inside, 'Filter in')).toHaveAttribute('aria-label', 'Filter in, patched to oscillator saw out')
  })

  it('its parts are controls: a step button, the run key, a knob turned by a drag', async () => {
    const { run, snap, svg, inside } = await play()
    click(inside.querySelector('[aria-label="Step 2 (2)"]')!)
    await run(20)
    expect(snap().state).toBe('STEP 2 ON · A2')
    click(inside.querySelector('[aria-label="Run or stop the sequencer (Space)"]')!)
    await run(20)
    expect(snap().state).toBe('STOPPED · VCO → VCF → OUT')
    const tune = inside.querySelectorAll('circle.turn')[9]!
    const [x, y] = ['cx', 'cy'].map((a) => Number(tune.getAttribute(a)))
    pointer(svg(), 'pointerdown', [x!, y!])
    pointer(svg(), 'pointermove', [x!, y! - 12])
    pointer(svg(), 'pointerup', [x!, y! - 12])
    await run(20)
    expect(snap().state).toBe('TUNE · +3 ST')
  })

  it('lights the modules a note reaches: steady with reduced motion, a pulse down each cable without', async () => {
    const { handle, run, inside } = await play()
    const leds = () => [...inside.querySelectorAll<SVGElement>('circle.lv')].map((n) => Number(n.style.opacity))
    expect(leds()).toEqual([1, 1, 1])
    for (let i = 0; i < 3; i++) act(() => handle().press('p'))
    await run(50)
    expect(leds()).toEqual([1, 0, 1])
    expect([...inside.querySelectorAll<SVGElement>('path.cp')].every((p) => !Number(p.style.opacity))).toBe(true)
    cleanup()
    const moving = await play([], { reducedMotion: 'never' })
    let pulsed = false
    for (let t = 0; t < 30 && !pulsed; t++) {
      await moving.run(20)
      pulsed = [...moving.inside.querySelectorAll<SVGElement>('path.cp')].some((p) => Number(p.style.opacity) > 0.5)
    }
    expect(pulsed).toBe(true)
  })

  it('keeps its drawing the same size through seconds of play and every interaction', async () => {
    const { handle, run, svg, inside } = await play([], { reducedMotion: 'never' })
    const count = () => svg().querySelectorAll('*').length
    const nodes = count()
    await run(3000)
    expect(count()).toBe(nodes)
    for (const hint of modularSynth.keys)
      for (const key of hint.keys) {
        act(() => handle().press(key))
        await run(40)
      }
    drag(svg(), at(inside, 'Oscillator saw out'), at(inside, 'Output in'))
    drag(svg(), at(inside, 'Sequencer gate out'), at(inside, 'Envelope gate in'))
    pointer(svg(), 'pointerdown', at(inside, 'Output in'))
    pointer(svg(), 'pointermove', [0, 0])
    await run(200)
    expect(count()).toBe(nodes)
    pointer(svg(), 'pointerup', [0, 0])
    act(() => handle().press('p'))
    await run(3000)
    expect(count()).toBe(nodes)
  })
})
