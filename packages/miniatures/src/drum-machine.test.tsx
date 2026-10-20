import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureDrumMachine, drumMachine } from './drum-machine'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureDrumMachine, drumMachine)

const instruments = [
  ['1', 'BD', 'KICK', 'x...x...x...x.x.'],
  ['2', 'SD', 'SNARE', '....x.......x...'],
  ['3', 'LT', 'LOW TOM', '..............x.'],
  ['4', 'HT', 'HI TOM', '.............x..'],
  ['5', 'RS', 'RIM', '...x......x.....'],
  ['6', 'CP', 'CLAP', '............x...'],
  ['7', 'CH', 'CLOSED HAT', 'xx.xxx.xxx.xxx.x'],
  ['8', 'OH', 'OPEN HAT', '..x...x...x...x.'],
] as const
const stepKeys = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k'] as const
const pattern = (inside: ShadowRoot, row: number) => [...inside.querySelectorAll('.od')].slice(row * 16, (row + 1) * 16).map((dot) => dot.classList.contains('on') ? 'x' : '.').join('')

describe('DrumMachine', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('starts stopped at 122 BPM and 54% swing, with the kick selected and pattern A01 loaded', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDrumMachine, { reducedMotion: 'always' })
    await run(100)
    expect(handle().getSnapshot()).toEqual(drumMachine.initial)
    instruments.forEach(([, , , steps], row) => expect(pattern(inside, row)).toBe(steps))
    expect(inside.querySelector('.seg')).toHaveTextContent('122.0')
    expect(inside.querySelectorAll('.lc.on.r')).toHaveLength(5)
  })

  it('Space starts the sequencer, advances its playhead, then stops it', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDrumMachine, { reducedMotion: 'always' })
    act(() => handle().press(' '))
    await run(160)
    expect(handle().getSnapshot().pressed[' ']).toBe(true)
    expect(handle().getSnapshot().readout).toBe('▶ 122 BPM · SWING 54% · STEP 01')
    expect(inside.querySelector('[aria-label="Start or stop (Space)"]')).toHaveAttribute('aria-pressed', 'true')
    expect(inside.querySelectorAll('.od.ph')).toHaveLength(8)
    await run(200)
    expect(handle().getSnapshot().readout).toMatch(/STEP 0[23]$/)
    act(() => handle().press('space'))
    await run(100)
    expect(handle().getSnapshot()).toEqual(drumMachine.initial)
    expect(inside.querySelectorAll('.od.ph')).toHaveLength(0)
    expect(inside.querySelector('[aria-label="Start or stop (Space)"]')).toHaveAttribute('aria-pressed', 'false')
  })

  it.each(stepKeys.map((key, step) => [key, step] as const))('%s toggles its step on the selected track and back again', async (key, step) => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDrumMachine, { reducedMotion: 'always' })
    await run(100)
    const original = instruments[0][3]
    const steps = [...original]
    steps[step] = original[step] === 'x' ? '.' : 'x'
    act(() => handle().press(key))
    await run(100)
    expect(pattern(inside, 0)).toBe(steps.join(''))
    expect(handle().getSnapshot().state).toBe(`BD · KICK · ${original[step] === 'x' ? 4 : 6} STEPS · PATTERN A01`)
    expect(handle().getSnapshot().readout).toBe(drumMachine.initial.readout)
    instruments.slice(1).forEach(([, , , other], row) => expect(pattern(inside, row + 1)).toBe(other))
    act(() => handle().press(key))
    await run(100)
    expect(pattern(inside, 0)).toBe(original)
    expect(handle().getSnapshot().state).toBe(drumMachine.initial.state)
  })

  it.each(instruments.map((instrument, row) => [...instrument, row] as const))('%s selects %s and shows its programmed steps', async (key, code, name, steps, row) => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDrumMachine, { reducedMotion: 'always' })
    act(() => handle().press(key))
    await run(100)
    const count = [...steps].filter((step) => step === 'x').length
    expect(handle().getSnapshot().state).toBe(`${code} · ${name} · ${count} STEP${count === 1 ? '' : 'S'} · PATTERN A01`)
    expect(inside.querySelectorAll('.lc.on.r')).toHaveLength(count)
    const selected = inside.querySelectorAll('.lc.on.a')
    expect(selected).toHaveLength(1)
    expect(Number(selected[0]!.getAttribute('x'))).toBeCloseTo(69.5 + row * 15 - 0.65)
    act(() => handle().press('q'))
    await run(100)
    expect(pattern(inside, row)).toBe((steps[0] === 'x' ? '.' : 'x') + steps.slice(1))
    if (row !== 0) expect(pattern(inside, 0)).toBe(instruments[0][3])
  })

  it.each([['ArrowUp', 123], ['ArrowDown', 121]] as const)('%s changes the tempo display and knob', async (key, bpm) => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDrumMachine, { reducedMotion: 'always' })
    await run(100)
    const pointer = inside.querySelector('[aria-label="Tempo knob (Up and Down arrows)"] [class="ptr.k"]')!.parentElement!
    const initial = pointer.getAttribute('transform')
    act(() => handle().press(key))
    await run(100)
    expect(handle().getSnapshot().readout).toBe(`■ ${bpm} BPM · SWING 54%`)
    expect(inside.querySelector('.seg')).toHaveTextContent(`${bpm}.0`)
    expect(pointer.getAttribute('transform')).not.toBe(initial)
    expect(handle().getSnapshot().state).toBe(drumMachine.initial.state)
  })

  it.each([['ArrowLeft', 52], ['ArrowRight', 56]] as const)('%s changes swing and its knob', async (key, swing) => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDrumMachine, { reducedMotion: 'always' })
    await run(100)
    const pointer = inside.querySelector('[aria-label="Swing knob (Left and Right arrows)"] .ptr')!.parentElement!
    const initial = pointer.getAttribute('transform')
    act(() => handle().press(key))
    await run(100)
    expect(handle().getSnapshot().readout).toBe(`■ 122 BPM · SWING ${swing}%`)
    expect(pointer.getAttribute('transform')).not.toBe(initial)
    expect(handle().getSnapshot().state).toBe(drumMachine.initial.state)
  })

  it('Backspace clears only the selected track and reports when it is already empty', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniatureDrumMachine, { reducedMotion: 'always' })
    act(() => handle().press('2'))
    act(() => handle().press('Backspace'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('SD CLEARED')
    expect(handle().getSnapshot().readout).toBe(drumMachine.initial.readout)
    expect(pattern(inside, 1)).toBe('................')
    expect(pattern(inside, 0)).toBe(instruments[0][3])
    expect(inside.querySelectorAll('.lc.on.r')).toHaveLength(0)
    await run(1600)
    expect(handle().getSnapshot().state).toBe('SD · SNARE · 0 STEPS · PATTERN A01')
    act(() => handle().press('Backspace'))
    await run(100)
    expect(handle().getSnapshot().state).toBe('SD ALREADY EMPTY')
  })
})
