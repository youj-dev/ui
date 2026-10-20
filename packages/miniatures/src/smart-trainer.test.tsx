import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureSmartTrainer, type MiniatureSmartTrainerKey, smartTrainer } from './smart-trainer'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureSmartTrainer, smartTrainer)

describe('SmartTrainer', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureSmartTrainerKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureSmartTrainer, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts still at level four, in 50×17, with the fan off', async () => {
    const { snap } = await play()
    expect(snap()).toEqual(smartTrainer.initial)
  })

  it('Space pedals: power, cadence and speed appear, and Space again coasts', async () => {
    const { handle, run, snap } = await play([' '])
    expect(snap().pressed[' ']).toBe(true)
    expect(snap().readout).toMatch(/^[1-9]\d* W · [1-9]\d* RPM · [1-9]/)
    expect(snap().state).toMatch(/^ZONE \d · LEVEL 4 · 50×17 · FAN OFF$/)
    act(() => handle().press(' '))
    await run(4000)
    expect(snap().pressed[' ']).toBe(false)
    expect(snap().readout).toBe('0 W · 0 RPM · 0.0 KM/H')
  })

  it('the up and down arrows change the resistance level', async () => {
    const up = await play(['ArrowUp'])
    expect(up.snap().state).toBe('LEVEL 5 · 50×17 · FAN OFF')
    cleanup()
    const down = await play(['ArrowDown'])
    expect(down.snap().state).toBe('LEVEL 3 · 50×17 · FAN OFF')
  })

  it('the left and right arrows shift the rear cog', async () => {
    const left = await play(['ArrowLeft'])
    expect(left.snap().state).toBe('LEVEL 4 · 50×19 · FAN OFF')
    cleanup()
    const right = await play(['ArrowRight'])
    expect(right.snap().state).toBe('LEVEL 4 · 50×15 · FAN OFF')
  })

  it('F turns the fan on', async () => {
    const { snap } = await play(['f'])
    expect(snap().state).toBe('LEVEL 4 · 50×17 · FAN LOW')
    expect(snap().pressed.f).toBe(true)
  })
})
