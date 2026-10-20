import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { MiniatureStageSynth, type MiniatureStageSynthKey, stageSynth } from './stage-synth'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureStageSynth, stageSynth)

const notes = [
  ['a', 60, 'C4'], ['w', 61, 'C♯4'], ['s', 62, 'D4'], ['e', 63, 'D♯4'],
  ['d', 64, 'E4'], ['f', 65, 'F4'], ['t', 66, 'F♯4'], ['g', 67, 'G4'],
  ['y', 68, 'G♯4'], ['h', 69, 'A4'], ['u', 70, 'A♯4'], ['j', 71, 'B4'],
  ['k', 72, 'C5'], ['o', 73, 'C♯5'], ['l', 74, 'D5'], ['p', 75, 'D♯5'],
  [';', 76, 'E5'], ["'", 77, 'F5'],
] as const

describe('StageSynth', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('starts on grand piano with 73 keys, the middle octave and a 70% filter', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureStageSynth, { reducedMotion: 'always' })
    await run(100)
    expect(handle().getSnapshot()).toEqual(stageSynth.initial)
    expect(inside.querySelectorAll('.key')).toHaveLength(73)
    expect(inside.querySelectorAll('.key.on')).toHaveLength(0)
    expect(inside.querySelectorAll('.lgd.rg')).toHaveLength(18)
    expect(inside.querySelector('[aria-label="Piano section (2)"]')).toHaveAttribute('aria-pressed', 'true')
    expect(inside.querySelector('.ol')).toHaveTextContent('07 GRAND')
  })

  it.each(notes)('%s plays %s (%s) and remembers it after release', async (key, midi, name) => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureStageSynth, { reducedMotion: 'always' })
    act(() => handle().press(key))
    await run(50)
    expect(handle().getSnapshot().readout).toBe('PIANO · GRAND')
    expect(handle().getSnapshot().state).toBe(`LAST ${name} · OCT 0 · CUT 70%`)
    // press() sends both down and up: the key and its guide return to their idle state.
    expect(inside.querySelector(`[data-n="${midi}"]`)).not.toHaveClass('on')
    expect(inside.querySelectorAll('.lgd.on')).toHaveLength(0)
  })

  it('held notes dip their keys, light the guide and appear together until released', async () => {
    const run = useFrames()
    const { handle, host, inside } = mount(MiniatureStageSynth, { reducedMotion: 'always' })
    for (const key of ['a', 'e']) act(() => void host.dispatchEvent(new KeyboardEvent('keydown', { key })))
    await run(50)
    expect(handle().getSnapshot().state).toBe('C4 D♯4 · OCT 0 · CUT 70%')
    expect(inside.querySelector('[data-n="60"]')).toHaveClass('on')
    expect(inside.querySelector('[data-n="63"]')).toHaveClass('on')
    expect(inside.querySelectorAll('.lgd.on')).toHaveLength(2)
    expect(inside.querySelector('.ol.s')).toHaveTextContent('C4 D♯4')
    for (const key of ['a', 'e']) act(() => void host.dispatchEvent(new KeyboardEvent('keyup', { key })))
    expect(handle().getSnapshot().state).toBe('LAST D♯4 · OCT 0 · CUT 70%')
    expect(inside.querySelectorAll('.key.on')).toHaveLength(0)
    expect(inside.querySelectorAll('.lgd.on')).toHaveLength(0)
  })

  it.each([
    ['1', 'ORGAN', ['B3', 'VOX', 'FARF'], 'var(--c1)'],
    ['2', 'PIANO', ['UPRIGHT', 'E.PIANO', 'CLAV', 'GRAND'], 'var(--c2)'],
    ['3', 'SYNTH', ['SAW LEAD', 'SQUARE', 'POLY PAD'], 'var(--c3)'],
  ] as const)('%s selects %s and cycles its models', async (key, section, models, colour) => {
    const run = useFrames()
    const { handle, inside, root } = mount(MiniatureStageSynth, { reducedMotion: 'always' })
    for (const model of models) {
      act(() => handle().press(key))
      await run(50)
      expect(handle().getSnapshot().readout).toBe(`${section} · ${model}${key === '1' ? ' · 888000000' : ''}`)
      expect(handle().getSnapshot().state).toBe("PLAY A–' · OCT 0 · CUT 70%")
      expect(inside.querySelector(`[aria-label$="section (${key})"]`)).toHaveAttribute('aria-pressed', 'true')
      expect(inside.querySelector('.ol')).toHaveTextContent(`07 ${model}`)
      expect(root().style.getPropertyValue('--kc')).toBe(colour)
      expect(document.documentElement.style.getPropertyValue('--kc')).toBe('')
    }
  })

  it('Z and X move the playable range and notes, stopping at two octaves in either direction', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureStageSynth, { reducedMotion: 'always' })
    for (const [key, oct, first, last, note] of [
      ['z', -1, 48, 65, 'C3'], ['z', -2, 36, 53, 'C2'], ['z', -2, 36, 53, 'C2'],
      ['x', -1, 48, 65, 'C3'], ['x', 0, 60, 77, 'C4'], ['x', 1, 72, 89, 'C5'],
      ['x', 2, 84, 100, 'C6'], ['x', 2, 84, 100, 'C6'],
    ] as const) {
      act(() => handle().press(key))
      act(() => handle().press('a'))
      await run(50)
      const signed = oct > 0 ? `+${oct}` : String(oct)
      expect(handle().getSnapshot().state).toBe(`LAST ${note} · OCT ${signed} · CUT 70%`)
      const guides = inside.querySelectorAll('.lgd')
      expect(guides[first - 28]).toHaveClass('rg')
      expect(guides[last - 28]).toHaveClass('rg')
      expect(guides[first - 29]).not.toHaveClass('rg')
      expect(inside.querySelectorAll('.lgd.rg')).toHaveLength(last - first + 1)
    }
  })

  it('R selects the organ and cycles all seven visible drawbar registrations', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureStageSynth, { reducedMotion: 'always' })
    for (const registration of ['838000000', '886000000', '800000888', '688600000', '008530000', '888888888', '888000000']) {
      act(() => handle().press('r'))
      await run(50)
      expect(handle().getSnapshot().readout).toBe(`ORGAN · B3 · ${registration}`)
      expect(handle().getSnapshot().state).toBe("PLAY A–' · OCT 0 · CUT 70%")
      for (const [index, level] of [...registration].entries()) {
        expect(inside.querySelector(`[aria-label="Drawbar ${index + 1}"]`)!.querySelectorAll('.db.on')).toHaveLength(Number(level))
      }
    }
  })

  it('Up and Down sweep the filter, rotating the knob and stopping at 0 and 100%', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureStageSynth, { reducedMotion: 'always' })
    const indicator = inside.querySelector('[aria-label="Filter cutoff (Up and Down arrows)"] .ind')!.parentElement!
    await run(50)
    const initial = indicator.getAttribute('transform')
    act(() => handle().press('ArrowUp'))
    await run(50)
    expect(handle().getSnapshot().state).toBe("PLAY A–' · OCT 0 · CUT 75%")
    expect(indicator.getAttribute('transform')).not.toBe(initial)
    act(() => handle().press('ArrowDown'))
    await run(50)
    expect(handle().getSnapshot().state).toBe("PLAY A–' · OCT 0 · CUT 70%")
    expect(indicator.getAttribute('transform')).toBe(initial)
    for (let i = 0; i < 25; i++) act(() => handle().press('ArrowUp'))
    await run(50)
    expect(handle().getSnapshot().state).toBe("PLAY A–' · OCT 0 · CUT 100%")
    expect(indicator).toHaveAttribute('transform', 'rotate(135.00)')
    for (let i = 0; i < 25; i++) act(() => handle().press('ArrowDown'))
    await run(50)
    expect(handle().getSnapshot().state).toBe("PLAY A–' · OCT 0 · CUT 0%")
    expect(indicator).toHaveAttribute('transform', 'rotate(-135.00)')
  })

  it('M toggles vibrato and rolls the mod wheel', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureStageSynth, { reducedMotion: 'always' })
    const wheel = inside.querySelector('[aria-label="Mod wheel: vibrato (M)"]')!
    await run(50)
    const before = wheel.querySelector('.knurl')!.getAttribute('d')
    act(() => handle().press('m'))
    await run(50)
    expect(handle().getSnapshot().pressed.m).toBe(true)
    expect(handle().getSnapshot().state).toBe("PLAY A–' · OCT 0 · CUT 70% · VIBRATO")
    expect(wheel).toHaveAttribute('aria-pressed', 'true')
    expect(wheel.querySelector('.knurl')!.getAttribute('d')).not.toBe(before)
    act(() => handle().press('m'))
    await run(50)
    expect(handle().getSnapshot().pressed.m).toBe(false)
    expect(handle().getSnapshot().state).toBe("PLAY A–' · OCT 0 · CUT 70%")
    expect(wheel).toHaveAttribute('aria-pressed', 'false')
    expect(wheel.querySelector('.knurl')!.getAttribute('d')).toBe(before)
  })

  it('types every playable key and control from its metadata', () => {
    expectTypeOf<MiniatureStageSynthKey>().toEqualTypeOf<
      'a' | 's' | 'd' | 'f' | 'g' | 'h' | 'j' | 'k' | 'l' | ';' | "'" |
      'w' | 'e' | 't' | 'y' | 'u' | 'o' | 'p' |
      'z' | 'x' | '1' | '2' | '3' | 'r' | 'ArrowUp' | 'ArrowDown' | 'm'
    >()
  })
})
