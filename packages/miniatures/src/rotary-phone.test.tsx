import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureRotaryPhone, type MiniatureRotaryPhoneKey, rotaryPhone } from './rotary-phone'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureRotaryPhone, rotaryPhone)

describe('RotaryPhone', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureRotaryPhoneKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureRotaryPhone, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts on hook, ready for a call', async () => {
    const { snap, svg } = await play()
    expect(snap()).toEqual(rotaryPhone.initial)
    expect(svg()).not.toHaveClass('powered')
  })

  it('H lifts the handset to a dial tone and H puts it back', async () => {
    const { handle, run, snap, svg } = await play(['h'])
    expect(snap().readout).toBe('— — — · LINE OPEN')
    expect(snap().state).toBe('DIAL TONE · READY')
    expect(svg()).toHaveClass('powered')
    act(() => handle().press('h'))
    await run(400)
    expect(snap().readout).toMatch(/ON HOOK$/)
    expect(svg()).not.toHaveClass('powered')
  })

  it.each([
    ['1', '1 PULSES'],
    ['5', '5 PULSES'],
    ['0', '10 PULSES'],
  ] as const)('%s dials %s and shows the digit', async (digit, pulses) => {
    const { snap } = await play([digit])
    expect(snap().state).toBe(`DIALED ${digit} · ${pulses}`)
    expect(snap().readout).toMatch(new RegExp(`^${digit} · `))
  })

  it('R rings the phone and H answers the call', async () => {
    const { handle, run, snap } = await play(['r'])
    expect(snap().readout).toBe('— — — · INCOMING')
    expect(snap().state).toBe('INCOMING CALL · LIFT TO ANSWER')
    act(() => handle().press('h'))
    await run(400)
    expect(snap().readout).toMatch(/CONNECTED$/)
    expect(snap().state).toBe('CALL CONNECTED · K TO HOLD')
  })

  it('K holds a connected call and resumes it', async () => {
    const { handle, run, snap } = await play(['r', 'h', 'k'])
    expect(snap().readout).toBe('— — — · ON HOLD')
    expect(snap().state).toBe('LINE 1 HELD · K TO RESUME')
    act(() => handle().press('k'))
    await run(400)
    expect(snap().readout).toMatch(/CONNECTED$/)
  })

  it('K with no call says there is nothing to hold', async () => {
    const { snap } = await play(['k'])
    expect(snap().state).toBe('NO CALL TO HOLD')
  })
})
