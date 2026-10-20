import { act, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MiniatureMainframe, mainframe } from './mainframe'
import { seedRandom, useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureMainframe, mainframe)

describe('Mainframe', () => {
  beforeEach(() => seedRandom())
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('starts with the readout "READY · L TO LOAD CARDS"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMainframe, { reducedMotion: 'always' })
    await run(300)
    expect(handle().getSnapshot()).toEqual({ readout: 'SR 245 · CARDS 00/00 · LINES 000', state: 'READY · L TO LOAD CARDS', pressed: { ' ': false, f: false } })
  })

  it('L (load cards) shows "LOADING · CARD 07/18"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMainframe, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('l'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'SR 245 · CARDS 06/18 · LINES 000', state: 'LOADING · CARD 07/18', pressed: { ' ': false, f: false } })
  })

  it('Space (run / halt) shows "RUNNING · TAPE 1 READ"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMainframe, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press(' '))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'SR 245 · CARDS 00/00 · LINES 000', state: 'RUNNING · TAPE 1 READ', pressed: { ' ': true, f: false } })
    act(() => handle().press(' '))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'SR 245 · CARDS 00/00 · LINES 000', state: 'HALTED · SPACE TO RUN', pressed: { ' ': false, f: false } })
  })

  it('P (print) shows "PRINTING · LINE 013"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMainframe, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('p'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'SR 245 · CARDS 00/00 · LINES 013', state: 'PRINTING · LINE 013', pressed: { ' ': false, f: false } })
  })

  it('F (fault) shows "MACHINE CHECK · PARITY · R TO RESET"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMainframe, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('f'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'SR 245 · CARDS 00/00 · LINES 000', state: 'MACHINE CHECK · PARITY · R TO RESET', pressed: { ' ': false, f: true } })
    act(() => handle().press('f'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'SR 245 · CARDS 00/00 · LINES 000', state: 'MACHINE CHECK · R TO RESET', pressed: { ' ': false, f: true } })
  })

  it('R (reset) shows "READY · L TO LOAD CARDS"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMainframe, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('r'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'SR 245 · CARDS 00/00 · LINES 000', state: 'READY · L TO LOAD CARDS', pressed: { ' ': false, f: false } })
  })

  it('1–8 (switches) shows "READY · L TO LOAD CARDS"', async () => {
    const run = useFrames()
    const { handle } = mount(MiniatureMainframe, { reducedMotion: 'always' })
    await run(300)
    act(() => handle().press('1'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'SR 045 · CARDS 00/00 · LINES 000', state: 'READY · L TO LOAD CARDS', pressed: { ' ': false, f: false } })
    act(() => handle().press('2'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'SR 145 · CARDS 00/00 · LINES 000', state: 'READY · L TO LOAD CARDS', pressed: { ' ': false, f: false } })
    act(() => handle().press('3'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'SR 105 · CARDS 00/00 · LINES 000', state: 'READY · L TO LOAD CARDS', pressed: { ' ': false, f: false } })
    act(() => handle().press('4'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'SR 125 · CARDS 00/00 · LINES 000', state: 'READY · L TO LOAD CARDS', pressed: { ' ': false, f: false } })
    act(() => handle().press('5'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'SR 135 · CARDS 00/00 · LINES 000', state: 'READY · L TO LOAD CARDS', pressed: { ' ': false, f: false } })
    act(() => handle().press('6'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'SR 131 · CARDS 00/00 · LINES 000', state: 'READY · L TO LOAD CARDS', pressed: { ' ': false, f: false } })
    act(() => handle().press('7'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'SR 133 · CARDS 00/00 · LINES 000', state: 'READY · L TO LOAD CARDS', pressed: { ' ': false, f: false } })
    act(() => handle().press('8'))
    await run(400)
    expect(handle().getSnapshot()).toEqual({ readout: 'SR 132 · CARDS 00/00 · LINES 000', state: 'READY · L TO LOAD CARDS', pressed: { ' ': false, f: false } })
  })
})
