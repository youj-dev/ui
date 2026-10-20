import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureUpsCabinet, type MiniatureUpsCabinetKey, upsCabinet } from './ups-cabinet'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureUpsCabinet, upsCabinet)

describe('UpsCabinet', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureUpsCabinetKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureUpsCabinet, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts on line power, half loaded, with the generator on standby', async () => {
    const { snap } = await play([], 0)
    expect(snap().readout).toMatch(/^ON LINE · LOAD 50% · BATT 100% · \d+ MIN$/)
    expect(snap().state).toBe(upsCabinet.initial.state)
    expect(snap().pressed).toEqual(upsCabinet.initial.pressed)
  })

  it('M pulls the mains: the UPS goes on battery, the generator starts and the alarm sounds', async () => {
    const { handle, run, snap } = await play(['m'])
    expect(snap().readout).toMatch(/^ON BATTERY · LOAD 50%/)
    expect(snap().state).toBe('UTILITY LOST · GENERATOR STARTING · ALARM')
    expect(snap().pressed.m).toBe(true)
    act(() => handle().press('m'))
    await run(400)
    expect(snap().readout).toMatch(/^ON LINE/)
    expect(snap().pressed.m).toBe(false)
  })

  it('L adds load', async () => {
    const { snap } = await play(['l'])
    expect(snap().readout).toMatch(/^ON LINE · LOAD 75%/)
  })

  it('T runs a battery test', async () => {
    const { snap } = await play(['t'])
    expect(snap().readout).toMatch(/^BATTERY TEST · LOAD 50%/)
  })

  it('B puts the load on bypass, unprotected', async () => {
    const { handle, run, snap } = await play(['b'])
    expect(snap().readout).toMatch(/^BYPASS · LOAD 50%/)
    expect(snap().state).toBe('LOAD NOT PROTECTED · UTILITY OK')
    expect(snap().pressed.b).toBe(true)
    act(() => handle().press('b'))
    await run(400)
    expect(snap().readout).toMatch(/^ON LINE/)
    expect(snap().pressed.b).toBe(false)
  })

  it('A silences the alarm', async () => {
    const { handle, run, snap } = await play(['m'])
    expect(snap().state).toMatch(/ALARM$/)
    act(() => handle().press('a'))
    await run(400)
    expect(snap().state).not.toMatch(/ALARM$/)
  })
})
