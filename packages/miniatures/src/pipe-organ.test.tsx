import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import type { MiniatureSnapshot } from './engine/types'
import { MiniaturePipeOrgan, type MiniaturePipeOrganKey, pipeOrgan } from './pipe-organ'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniaturePipeOrgan, pipeOrgan)

describe('PipeOrgan', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('starts silent, with the Gedackt drawn, the blower off and the gauge level', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniaturePipeOrgan)
    await run(100)
    expect(handle().getSnapshot()).toMatchObject(pipeOrgan.initial)
    expect(inside.querySelectorAll('.key')).toHaveLength(25)
    expect(inside.querySelectorAll('.pipe')).toHaveLength(125)
    expect(inside.querySelectorAll('.rank.armed')).toHaveLength(1)
    expect(inside.querySelector('.rank.armed')).toHaveClass('rk1')
    expect(inside.querySelector('.stop.rk1')).toHaveAttribute('aria-pressed', 'true')
    expect(inside.querySelectorAll('.key.down, .pipe.lit')).toHaveLength(0)
    expect(svg()).not.toHaveClass('wind')
    for (const column of inside.querySelectorAll('.water')) {
      expect(column).toHaveAttribute('y', '9')
      expect(column).toHaveAttribute('height', '9')
    }
  })

  // Keyboard order and Gedackt pipe positions from the lab drawing: the
  // naturals precede the sharps, and the stopped rank has bass at both ends.
  it.each([
    ['a', 'C3', 0, 24], ['s', 'D3', 1, 23], ['d', 'E3', 2, 22],
    ['f', 'F3', 3, 2], ['g', 'G3', 4, 3], ['h', 'A3', 5, 4],
    ['j', 'B3', 6, 5], ['k', 'C4', 7, 18], ['l', 'D4', 8, 17],
    [';', 'E4', 9, 16], ["'", 'F4', 10, 8],
    ['w', 'C♯3', 15, 0], ['e', 'D♯3', 16, 1], ['t', 'F♯3', 17, 21],
    ['y', 'G♯3', 18, 20], ['u', 'A♯3', 19, 19], ['o', 'C♯4', 20, 6],
    ['p', 'D♯4', 21, 7],
  ] as const)('%s plays %s: lowers its key, lights its pipe and starts the wind', async (shortcut, note, keyIndex, pipeIndex) => {
    const run = useFrames()
    const { handle, host, inside } = mount(MiniaturePipeOrgan, { reducedMotion: 'always' })
    const drawnKey = inside.querySelectorAll('.key')[keyIndex]!
    const pipe = inside.querySelectorAll('.rank.rk1 > .pipe')[pipeIndex]!
    let sounding: MiniatureSnapshot | undefined
    let down: Element[] = []
    let lit: Element[] = []

    // press() sends down and up together. Observe before its keyup reaches
    // the figure, allowing one frame to publish the sounding note.
    host.addEventListener('keyup', () => {
      vi.advanceTimersByTime(32)
      sounding = handle().getSnapshot()
      down = [...inside.querySelectorAll('.key.down')]
      lit = [...inside.querySelectorAll('.pipe.lit')]
    }, { capture: true, once: true })
    act(() => handle().press(shortcut))
    expect(sounding).toMatchObject({ readout: note + ' · 1 STOP', state: 'WIND 55 MM · 8′', pressed: { b: true } })
    expect(down).toEqual([drawnKey])
    expect(lit).toEqual([pipe])
    await run(50)
    expect(handle().getSnapshot()).toMatchObject({ readout: '— · 1 STOP', state: 'WIND 55 MM · 8′', pressed: { b: true } })
    expect(inside.querySelectorAll('.key.down, .pipe.lit')).toHaveLength(0)
  })

  it.each([
    ['1', 'rk1', '— · 0 STOPS', 'WIND OFF · NO STOPS', false],
    ['2', 'rk2', '— · 2 STOPS', 'WIND OFF · 8′ + 4′', true],
    ['3', 'rk3', '— · 2 STOPS', 'WIND OFF · 8′ + 2′', true],
    ['4', 'rk4', '— · 2 STOPS', 'WIND OFF · 8′ + II', true],
  ] as const)('%s toggles its drawstop, slider and armed rank', async (shortcut, rank, readout, state, on) => {
    const run = useFrames()
    const { handle, inside } = mount(MiniaturePipeOrgan, { reducedMotion: 'always' })
    const stop = inside.querySelector('.stop.' + rank)!
    const pipes = inside.querySelector('.rank.' + rank)!
    const before = stop.innerHTML
    act(() => handle().press(shortcut))
    await run(50)
    expect(handle().getSnapshot()).toMatchObject({ readout, state, pressed: { b: false } })
    expect(stop).toHaveAttribute('aria-pressed', String(on))
    expect(stop.classList.contains('on')).toBe(on)
    expect(pipes.classList.contains('armed')).toBe(on)
    expect(stop.innerHTML).not.toBe(before)
    act(() => handle().press(shortcut))
    await run(50)
    expect(handle().getSnapshot()).toMatchObject(pipeOrgan.initial)
    expect(stop.innerHTML).toBe(before)
  })

  it('B fills and empties the reservoir: rocker, lamps and manometer follow the wind', async () => {
    const run = useFrames()
    const { handle, inside, svg } = mount(MiniaturePipeOrgan, { reducedMotion: 'always' })
    const blower = inside.getElementById('blower')!
    const rocker = blower.querySelector('.button-face')!
    const columns = inside.querySelectorAll('.water')
    act(() => handle().press('b'))
    await run(50)
    expect(handle().getSnapshot()).toMatchObject({ readout: '— · 1 STOP', state: 'WIND 55 MM · 8′', pressed: { b: true } })
    expect(svg()).toHaveClass('wind')
    expect(blower).toHaveAttribute('aria-pressed', 'true')
    expect(rocker).toHaveAttribute('y', '2.9')
    expect(Number(columns[0]!.getAttribute('y'))).toBeCloseTo(12.4)
    expect(Number(columns[1]!.getAttribute('y'))).toBeCloseTo(5.6)
    act(() => handle().press('b'))
    await run(50)
    expect(handle().getSnapshot()).toMatchObject(pipeOrgan.initial)
    expect(svg()).not.toHaveClass('wind')
    expect(blower).toHaveAttribute('aria-pressed', 'false')
    expect(rocker).toHaveAttribute('y', '0.8')
    for (const column of columns) expect(column).toHaveAttribute('y', '9')
  })

  it('Space plays the C, F, G, C cadence, then releases the keys and pipes', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniaturePipeOrgan, { reducedMotion: 'always' })
    act(() => handle().press('space'))
    await run(100)
    expect(handle().getSnapshot()).toMatchObject({ readout: 'C3 E3 G3 C4 · 1 STOP', state: 'WIND 50 MM · 8′', pressed: { b: true } })
    expect(inside.querySelectorAll('.key.down')).toHaveLength(4)
    expect(inside.querySelectorAll('.pipe.lit')).toHaveLength(4)
    await run(780)
    expect(handle().getSnapshot().readout).toBe('F3 A3 C4 F4 · 1 STOP')
    await run(780)
    expect(handle().getSnapshot().readout).toBe('G3 B3 D4 G4 · 1 STOP')
    await run(780)
    expect(handle().getSnapshot().readout).toBe('C3 E3 G3 C4 E4 · 1 STOP')
    expect(inside.querySelectorAll('.key.down')).toHaveLength(5)
    expect(inside.querySelectorAll('.pipe.lit')).toHaveLength(5)
    await run(1500)
    expect(handle().getSnapshot()).toMatchObject({ readout: '— · 1 STOP', state: 'WIND 55 MM · 8′', pressed: { b: true } })
    expect(inside.querySelectorAll('.key.down, .pipe.lit')).toHaveLength(0)
  })

  it.each(['space', 'b'] as const)('%s stops an active cadence and cancels its remaining chords', async (shortcut) => {
    const run = useFrames()
    const { handle, inside } = mount(MiniaturePipeOrgan, { reducedMotion: 'always' })
    act(() => handle().press('space'))
    await run(100)
    act(() => handle().press(shortcut))
    await run(50)
    expect(handle().getSnapshot()).toMatchObject({
      readout: '— · 1 STOP',
      state: shortcut === 'b' ? 'WIND OFF · 8′' : 'WIND 55 MM · 8′',
      pressed: { b: shortcut !== 'b' },
    })
    expect(inside.querySelectorAll('.key.down, .pipe.lit')).toHaveLength(0)
    const stopped = handle().getSnapshot()
    await run(4000)
    expect(handle().getSnapshot()).toEqual(stopped)
  })

  it('changing a stop during a chord lights and extinguishes that rank immediately', async () => {
    const run = useFrames()
    const { handle, inside } = mount(MiniaturePipeOrgan, { reducedMotion: 'always' })
    act(() => handle().press('space'))
    act(() => handle().press('4'))
    await run(50)
    expect(handle().getSnapshot().readout).toBe('C3 E3 G3 C4 · 2 STOPS')
    expect(handle().getSnapshot().state).toBe('WIND 43 MM · 8′ + II')
    expect(inside.querySelectorAll('.rk4 .pipe.lit')).toHaveLength(8)
    act(() => handle().press('1'))
    await run(50)
    expect(handle().getSnapshot().readout).toBe('C3 E3 G3 C4 · 1 STOP')
    expect(handle().getSnapshot().state).toBe('WIND 50 MM · II')
    expect(inside.querySelectorAll('.rk1 .pipe.lit')).toHaveLength(0)
    expect(inside.querySelectorAll('.rk4 .pipe.lit')).toHaveLength(8)
  })

  it('types and advertises every natural, sharp, stop and control key', () => {
    expectTypeOf<MiniaturePipeOrganKey>().toEqualTypeOf<
      'a' | 's' | 'd' | 'f' | 'g' | 'h' | 'j' | 'k' | 'l' | ';' | "'" |
      'w' | 'e' | 't' | 'y' | 'u' | 'o' | 'p' | '1' | '2' | '3' | '4' | 'b' | ' '
    >()
    const { host } = mount(MiniaturePipeOrgan)
    expect(host).toHaveAttribute('aria-keyshortcuts', "A S D F G H J K L ; ' W E T Y U O P 1 2 3 4 B Space")
    const about = document.getElementById(host.getAttribute('aria-describedby')!)
    expect(about?.textContent).toContain("Keys: A … ' naturals; W E T Y U O P sharps; 1–4 stops;")
  })

  it('keeps later drawing frames deterministic with sound off', async () => {
    const run = useFrames()
    const { handle } = mount(MiniaturePipeOrgan, { sound: false })
    // Port-log check: all three Math.random calls synthesize audio buffers
    // or choose a voice's noise offset; none drives geometry or animation.
    const random = vi.spyOn(Math, 'random')
    try {
      await run(1500)
      act(() => handle().press('space'))
      act(() => handle().press('2'))
      act(() => handle().press('3'))
      act(() => handle().press('4'))
      await run(3500)
      act(() => handle().press('a'))
      act(() => handle().press('b'))
      await run(1500)
      expect(random).not.toHaveBeenCalled()
      expect(handle().getSnapshot()).toMatchObject({ readout: '— · 4 STOPS', state: 'WIND OFF · 8′ + 4′ + 2′ + II', pressed: { b: false } })
    } finally {
      random.mockRestore()
    }
  })
})
