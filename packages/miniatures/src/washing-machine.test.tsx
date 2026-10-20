import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureWashingMachine, type MiniatureWashingMachineKey, washingMachine } from './washing-machine'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureWashingMachine, washingMachine)

describe('WashingMachine', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureWashingMachineKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureWashingMachine, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts empty with the door closed on the cotton 40° program', async () => {
    const { snap } = await play()
    expect(snap()).toEqual(washingMachine.initial)
  })

  it('O opens the door and O closes it', async () => {
    const { handle, run, snap } = await play(['o'])
    expect(snap().state).toBe('DOOR OPEN · L TO LOAD')
    expect(snap().pressed.o).toBe(true)
    act(() => handle().press('o'))
    await run(400)
    expect(snap().pressed.o).toBe(false)
  })

  it('D opens the detergent drawer', async () => {
    const { snap } = await play(['d'])
    expect(snap().state).toBe('DRAWER OPEN · ADD DETERGENT')
    expect(snap().pressed.d).toBe(true)
  })

  it('L asks for the door to be opened before loading', async () => {
    const { snap } = await play(['l'])
    expect(snap().state).toBe('OPEN DOOR · O TO LOAD')
  })

  it('L loads laundry once the door is open', async () => {
    const { snap } = await play(['o', 'l'])
    expect(snap().state).not.toBe('DOOR OPEN · L TO LOAD')
    expect(snap().state).toMatch(/LOAD/i)
  })

  it('Space with nothing loaded asks for a load first', async () => {
    const { snap } = await play([' '])
    expect(snap().state).toBe('EMPTY · O THEN L TO LOAD')
    expect(snap().pressed[' ']).toBe(false)
  })

  it.each([
    ['1', 'COTTON 40° · 42:00', 'PROGRAM 1 · 1200 RPM'],
    ['2', 'QUICK 30° · 22:00', 'PROGRAM 2 · 1000 RPM'],
    ['3', 'DELICATE 20° · 36:00', 'PROGRAM 3 · 600 RPM'],
    ['4', 'SPIN · 14:00', 'PROGRAM 4 · 1200 RPM'],
  ] as const)('%s selects program %s', async (key, readout, state) => {
    const { snap } = await play([key])
    expect(snap().readout).toBe(readout)
    expect(snap().state).toBe(state)
  })
})
