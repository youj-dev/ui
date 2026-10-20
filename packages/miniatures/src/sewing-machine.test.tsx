import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureSewingMachine, type MiniatureSewingMachineKey, sewingMachine } from './sewing-machine'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureSewingMachine, sewingMachine)

describe('SewingMachine', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureSewingMachineKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureSewingMachine, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts ready with the lamp on and no stitches', async () => {
    const { snap, svg } = await play()
    expect(snap()).toEqual(sewingMachine.initial)
    expect(svg()).toHaveClass('lamp-lit')
    expect(svg()).not.toHaveClass('running')
  })

  it('Space sews: stitches and length grow, and Space again stops', async () => {
    const { handle, run, snap, svg } = await play([' '])
    expect(svg()).toHaveClass('running')
    expect(snap().state).toBe('SEWING · 360 SPM · LIGHT ON')
    expect(snap().readout).toMatch(/^Straight · 00[1-9] stitches · [1-9]/)
    act(() => handle().press(' '))
    await run(400)
    expect(svg()).not.toHaveClass('running')
    expect(snap().state).toBe('READY · 360 SPM · LIGHT ON')
  })

  it.each([
    ['1', 'Straight'],
    ['2', 'Zigzag'],
    ['3', 'Stretch'],
  ] as const)('%s selects the %s stitch', async (key, name) => {
    const { snap } = await play([key])
    expect(snap().readout).toBe(`${name} · 000 stitches · 0.0 mm`)
  })

  it('the arrows change the speed', async () => {
    const up = await play(['ArrowUp'])
    expect(up.snap().state).toBe('READY · 480 SPM · LIGHT ON')
    cleanup()
    const down = await play(['ArrowDown'])
    expect(down.snap().state).toBe('READY · 240 SPM · LIGHT ON')
  })

  it('L switches the lamp off and on', async () => {
    const { handle, run, snap, svg } = await play(['l'])
    expect(snap().state).toBe('READY · 360 SPM · LIGHT OFF')
    expect(svg()).not.toHaveClass('lamp-lit')
    act(() => handle().press('l'))
    await run(400)
    expect(snap().state).toBe('READY · 360 SPM · LIGHT ON')
    expect(svg()).toHaveClass('lamp-lit')
  })

  it('W turns the handwheel by hand', async () => {
    const { snap } = await play(['w'])
    expect(snap().state).toBe('HAND TURN · 360 SPM · LIGHT ON')
  })

  it('F raises the presser foot', async () => {
    const { snap } = await play(['f'])
    expect(snap().state).toBe('FOOT RAISED · 360 SPM · LIGHT ON')
  })
})
