import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureWorkstation, type MiniatureWorkstationKey, workstation } from './workstation'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureWorkstation, workstation)

describe('Workstation', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureWorkstationKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureWorkstation, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts idle with performance fans', async () => {
    const { snap, svg } = await play()
    expect(snap().readout).toBe(workstation.initial.readout)
    expect(snap().state).toBe('IDLE · PERFORMANCE FANS')
    expect(svg()).toHaveClass('rgb')
  })

  it('O powers it off and on again', async () => {
    const { handle, run, snap } = await play(['o'])
    expect(snap().readout).toBe('CPU — · GPU — · 0 W')
    expect(snap().state).toBe('OFF · O TO POWER')
    act(() => handle().press('o'))
    await run(400)
    expect(snap().readout).toMatch(/^CPU \d+°C · GPU \d+°C/)
  })

  it('R starts a render: the load, the heat and the lights climb', async () => {
    const { snap, svg } = await play(['r'])
    expect(snap().state).toMatch(/^RENDERING \d+% · FRAME \d{4}\/0400$/)
    expect(snap().readout).toMatch(/^CPU 4\d°C · GPU \d+°C · 1[5-9]\d W$/)
    expect(svg()).toHaveClass('rgb-on')
  })

  it('S switches to the silent fan profile and back', async () => {
    const { handle, run, snap } = await play(['s'])
    expect(snap().state).toBe('SILENT FAN PROFILE')
    act(() => handle().press('s'))
    await run(400)
    expect(snap().state).toBe('PERFORMANCE FAN PROFILE')
  })

  it('L switches the case lights off and on', async () => {
    const { handle, run, snap, svg } = await play(['l'])
    expect(snap().state).toBe('LIGHTS OFF')
    expect(svg()).not.toHaveClass('rgb')
    act(() => handle().press('l'))
    await run(400)
    expect(svg()).toHaveClass('rgb')
  })
})
