import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { MiniatureGuitarAmp, type MiniatureGuitarAmpKey, guitarAmp } from './guitar-amp'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureGuitarAmp, guitarAmp)

describe('GuitarAmp', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('starts live on the lead channel with warm valves and reverb off', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureGuitarAmp, { reducedMotion: 'always' })
    await run(100)
    expect(handle().getSnapshot()).toEqual(guitarAmp.initial)
    expect(inside.querySelector('[aria-label="power switch (P)"]')).toHaveAttribute('aria-pressed', 'true')
    expect(inside.querySelector('[aria-label="standby switch (S)"]')).toHaveAttribute('aria-pressed', 'true')
    expect(inside.querySelector('[aria-label="Reverb footswitch (V)"]')).toHaveAttribute('aria-pressed', 'false')
    expect(inside.querySelector('.jewel')).toHaveClass('on')
    expect(inside.querySelectorAll('.led.r')).toHaveLength(2)
    expect(Number((inside.querySelector('.fil') as SVGElement).style.opacity)).toBeGreaterThan(0.7)
  })

  it('P powers down, drops standby and extinguishes the lights; S restores live operation after power returns', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureGuitarAmp, { reducedMotion: 'always' })
    await run(100)
    act(() => handle().press('p'))
    await run(100)
    expect(handle().getSnapshot().pressed).toEqual({ p: false, s: false, v: false })
    expect(handle().getSnapshot().state).toBe('OFF · P TO POWER')
    expect(inside.querySelector('.jewel')).not.toHaveClass('on')
    expect(inside.querySelectorAll('.led.r, .led.g, .led.b')).toHaveLength(0)
    expect((inside.querySelector('.fil') as SVGElement).style.opacity).toBe('0')
    act(() => handle().press('p'))
    await run(100)
    expect(handle().getSnapshot().pressed.p).toBe(true)
    expect(handle().getSnapshot().state).toBe('STANDBY · READY · S TO PLAY')
    act(() => handle().press('s'))
    await run(100)
    expect(handle().getSnapshot().pressed.s).toBe(true)
    expect(handle().getSnapshot().state).toBe('LIVE · SPACE TO STRUM')
  })

  it('cools and warms the valves over time when motion is allowed', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureGuitarAmp)
    await run(100)
    act(() => handle().press('p'))
    await run(200)
    expect(handle().getSnapshot().state).toBe('OFF · VALVES COOLING')
    await run(3000)
    expect(handle().getSnapshot().state).toBe('OFF · P TO POWER')
    act(() => handle().press('p'))
    await run(200)
    expect(handle().getSnapshot().state).toMatch(/^STANDBY · WARMING \d+%$/)
    act(() => handle().press('s'))
    await run(200)
    expect(handle().getSnapshot().state).toMatch(/^WARMING \d+% · HT ON$/)
    await run(4000)
    expect(handle().getSnapshot().state).toBe('LIVE · SPACE TO STRUM')
    expect(Number((inside.querySelector('.fil') as SVGElement).style.opacity)).toBeGreaterThan(0.7)
  })

  it('S engages standby, silences a strum and lifts standby again', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureGuitarAmp, { reducedMotion: 'always' })
    await run(100)
    act(() => handle().press('s'))
    await run(100)
    expect(handle().getSnapshot().pressed.s).toBe(false)
    expect(handle().getSnapshot().state).toBe('STANDBY · READY · S TO PLAY')
    expect(inside.querySelectorAll('.led.r')).toHaveLength(1)
    act(() => handle().press('space'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('NO SOUND · STANDBY')
    expect((inside.querySelector('.capg') as SVGElement).style.opacity).toBe('0')
    await run(1800)
    act(() => handle().press('s'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('LIVE · SPACE TO STRUM')
  })

  it('S cannot lift standby while power is off, and Space reports that the amp is off', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureGuitarAmp, { reducedMotion: 'always' })
    await run(100)
    act(() => handle().press('p'))
    act(() => handle().press('s'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('POWER IS OFF')
    expect(handle().getSnapshot().pressed.s).toBe(false)
    act(() => handle().press(' '))
    await run(100)
    expect(handle().getSnapshot().state).toBe('NO SOUND · AMP OFF')
  })

  it('Space cycles the lead chords, lights the speaker caps and decays back to live', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureGuitarAmp, { reducedMotion: 'always' })
    await run(100)
    for (const chord of ['E5', 'G5', 'A5', 'D5', 'E5']) {
      act(() => handle().press('space'))
      await run(100)
      expect(handle().getSnapshot().state).toMatch(new RegExp(`^PLAYING ${chord} · [−\\d]+ dB$`))
      expect(Number((inside.querySelector('.capg') as SVGElement).style.opacity)).toBeGreaterThan(0.2)
    }
    await run(1800)
    expect(handle().getSnapshot().state).toBe('LIVE · SPACE TO STRUM')
    expect((inside.querySelector('.capg') as SVGElement).style.opacity).toBe('0')
  })

  it('F switches to clean chords and green channel lights, then back to lead', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureGuitarAmp, { reducedMotion: 'always' })
    await run(100)
    act(() => handle().press('f'))
    await run(100)
    expect(handle().getSnapshot().readout).toBe('CLEAN · GAIN 6.5 · TONE 6.0')
    expect(inside.querySelectorAll('.led.g')).toHaveLength(2)
    for (const chord of ['E', 'A', 'D', 'G']) {
      act(() => handle().press(' '))
      await run(100)
      expect(handle().getSnapshot().state).toMatch(new RegExp(`^PLAYING ${chord} · `))
    }
    act(() => handle().press('f'))
    await run(100)
    expect(handle().getSnapshot().readout).toBe('LEAD · GAIN 6.5 · TONE 6.0')
    expect(inside.querySelectorAll('.led.r')).toHaveLength(2)
  })

  it('V toggles reverb in the readout, footswitch and blue LED', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureGuitarAmp, { reducedMotion: 'always' })
    await run(100)
    act(() => handle().press('v'))
    await run(100)
    expect(handle().getSnapshot().pressed.v).toBe(true)
    expect(handle().getSnapshot().readout).toBe('LEAD · GAIN 6.5 · TONE 6.0 · REVERB')
    expect(inside.querySelector('[aria-label="Reverb footswitch (V)"]')).toHaveAttribute('aria-pressed', 'true')
    expect(inside.querySelectorAll('.led.b')).toHaveLength(1)
    act(() => handle().press('v'))
    await run(100)
    expect(handle().getSnapshot().pressed.v).toBe(false)
    expect(handle().getSnapshot().readout).toBe('LEAD · GAIN 6.5 · TONE 6.0')
    expect(inside.querySelectorAll('.led.b')).toHaveLength(0)
  })

  it.each([
    ['g', 'shift+g', 'Gain knob (G)', 'LEAD · GAIN 7.0 · TONE 6.0'],
    ['t', 'shift+t', 'Tone knob (T)', 'LEAD · GAIN 6.5 · TONE 6.5'],
  ] as const)('%s raises its knob by half a point; %s lowers it', async (up, down, label, raised) => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureGuitarAmp, { reducedMotion: 'always' })
    await run(100)
    const knob = inside.querySelector(`[aria-label="${label}"] g[transform^="rotate"]`)!
    const initial = knob.getAttribute('transform')
    act(() => handle().press(up))
    await run(100)
    expect(handle().getSnapshot().readout).toBe(raised)
    expect(knob.getAttribute('transform')).not.toBe(initial)
    act(() => handle().press(down))
    await run(100)
    expect(handle().getSnapshot().readout).toBe(guitarAmp.initial.readout)
    expect(knob.getAttribute('transform')).toBe(initial)
  })

  it('clamps gain and tone at zero and ten', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureGuitarAmp, { reducedMotion: 'always' })
    act(() => {
      for (let i = 0; i < 25; i++) {
        handle().press('g')
        handle().press('t')
      }
    })
    await run(100)
    expect(handle().getSnapshot().readout).toBe('LEAD · GAIN 10.0 · TONE 10.0')
    act(() => {
      for (let i = 0; i < 25; i++) {
        handle().press('shift+g')
        handle().press('shift+t')
      }
    })
    await run(100)
    expect(handle().getSnapshot().readout).toBe('LEAD · GAIN 0.0 · TONE 0.0')
  })

  it('lists and types the Shift combinations that turn the knobs down', () => {
    expectTypeOf<MiniatureGuitarAmpKey>().toEqualTypeOf<'p' | 's' | ' ' | 'g' | 't' | 'f' | 'v' | 'shift+g' | 'shift+t'>()
    const { host } = mount(MiniatureGuitarAmp)
    expect(host).toHaveAttribute('aria-keyshortcuts', 'P S Space G T F V Shift+G Shift+T')
  })
})
