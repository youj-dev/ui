import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureStandMixer, type MiniatureStandMixerKey, standMixer } from './stand-mixer'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureStandMixer, standMixer)

describe('StandMixer', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureStandMixerKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureStandMixer, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts with the head locked, the whisk fitted and the motor stopped', async () => {
    const { snap, svg } = await play()
    expect(snap()).toEqual(standMixer.initial)
    expect(svg()).not.toHaveClass('running')
  })

  it.each([
    ['1', '045'],
    ['2', '075'],
    ['3', '110'],
    ['4', '150'],
    ['5', '190'],
  ] as const)('%s runs the motor at speed %s rpm', async (key, rpm) => {
    const { snap, svg } = await play([key])
    expect(snap().readout).toBe(`WHISK · ${rpm} RPM`)
    expect(snap().state).toBe(`MIXING · SPEED ${key} / 5`)
    expect(svg()).toHaveClass('running')
  })

  it('0 stops the motor', async () => {
    const { snap, svg } = await play(['3', '0'])
    expect(snap().readout).toBe('WHISK · 000 RPM')
    expect(snap().state).toBe('HEAD LOCKED · STOPPED')
    expect(svg()).not.toHaveClass('running')
  })

  it('T raises the head and stops the motor, T again lowers and locks it', async () => {
    const { handle, run, snap, svg } = await play(['3', 't'])
    expect(snap().state).toBe('HEAD RAISED · MOTOR INTERLOCK')
    expect(snap().readout).toBe('WHISK · 000 RPM')
    expect(svg()).not.toHaveClass('running')
    act(() => handle().press('t'))
    await run(400)
    expect(snap().state).toBe('HEAD LOCKED · STOPPED')
  })

  it('choosing a speed with the head raised lowers and locks it, then runs', async () => {
    const { snap, svg } = await play(['t', '3'])
    expect(snap().state).toBe('MIXING · SPEED 3 / 5')
    expect(svg()).toHaveClass('running')
  })

  it('A swaps the whisk for the paddle, raising the head to do it', async () => {
    const { snap } = await play(['a'])
    expect(snap().readout).toBe('PADDLE · 000 RPM')
    expect(snap().state).toBe('HEAD RAISED · MOTOR INTERLOCK')
  })

  it('L lights the bowl', async () => {
    const { snap, svg } = await play(['l'])
    expect(snap().state).toBe('HEAD LOCKED · STOPPED · LIGHT')
    expect(svg()).toHaveClass('lit')
  })
})
