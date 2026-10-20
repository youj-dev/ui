import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureTelescope, type MiniatureTelescopeKey, telescope } from './telescope'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureTelescope, telescope)

describe('Telescope', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureTelescopeKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureTelescope, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts on the moon with the mount in manual, off target by an offset', async () => {
    const { snap } = await play()
    expect(snap().readout).toBe('RA -78.0° · DEC +26.0°')
    expect(snap().state).toBe(telescope.initial.state)
    expect(snap().pressed).toEqual(telescope.initial.pressed)
  })

  it.each([
    ['ArrowLeft', 'RA -82.0° · DEC +26.0°'],
    ['ArrowRight', 'RA -74.0° · DEC +26.0°'],
    ['ArrowUp', 'RA -78.0° · DEC +30.0°'],
    ['ArrowDown', 'RA -78.0° · DEC +22.0°'],
  ] as const)('%s slews the tube in steps of four degrees', async (key, readout) => {
    const { snap } = await play([key])
    expect(snap().readout).toBe(readout)
  })

  it.each([
    ['1', 'MOON', 'RA -70.0° · DEC +34.0°'],
    ['2', 'SATURN', 'RA -46.0° · DEC +17.0°'],
    ['3', 'JUPITER', 'RA -94.0° · DEC +48.0°'],
  ] as const)('%s slews to %s and acquires it', async (key, name, readout) => {
    const { snap } = await play([key])
    expect(snap().state).toBe(`${name} · ACQUIRED · MANUAL`)
    expect(snap().readout).toBe(readout)
  })

  it('T starts and stops tracking', async () => {
    const { handle, run, snap } = await play(['t'])
    expect(snap().state).toBe('MOON · TRACKING / OFFSET')
    expect(snap().pressed.t).toBe(true)
    act(() => handle().press('t'))
    await run(400)
    expect(snap().state).toBe('MOON · MANUAL / OFFSET')
    expect(snap().pressed.t).toBe(false)
  })

  it('F racks the focus', async () => {
    const { snap } = await play(['f'])
    expect(snap().state).toBe('FOCUS 100% · SHARP')
  })

  it('L switches to the red light for night vision, and back', async () => {
    const { handle, run, snap, svg } = await play(['l'])
    expect(snap().state).toBe('RED LIGHT · NIGHT VISION')
    expect(snap().pressed.l).toBe(true)
    expect(svg()).toHaveClass('red')
    act(() => handle().press('l'))
    await run(400)
    expect(snap().pressed.l).toBe(false)
    expect(svg()).not.toHaveClass('red')
  })
})
