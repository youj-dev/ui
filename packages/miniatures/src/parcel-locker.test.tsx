import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureParcelLocker, type MiniatureParcelLockerKey, parcelLocker } from './parcel-locker'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureParcelLocker, parcelLocker)

describe('ParcelLocker', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureParcelLockerKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureParcelLocker, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts waiting for a code, with the demo code offered', async () => {
    const { snap, svg } = await play()
    expect(snap()).toEqual(parcelLocker.initial)
    expect(svg()).not.toHaveClass('error')
  })

  it('each digit fills one place of the code', async () => {
    const { snap } = await play(['2', '4'])
    expect(snap().readout).toBe('CODE · 2 4 – –')
    expect(snap().state).toMatch(/^ENTER CODE/)
  })

  it('Enter on an incomplete code says four digits are required', async () => {
    const { snap, svg } = await play(['2', '4', 'Enter'])
    expect(snap().state).toBe('FOUR DIGITS REQUIRED')
    expect(svg()).toHaveClass('error')
  })

  it('Escape clears the code', async () => {
    const { snap, svg } = await play(['2', '4', 'Escape'])
    expect(snap().readout).toBe('CODE · – – – –')
    expect(snap().state).toBe('CODE CLEARED / DEMO 2468 → 04')
    expect(svg()).not.toHaveClass('error')
  })

  it('the right code opens locker 04 and Enter collects the parcel', async () => {
    const { handle, run, snap } = await play(['2', '4', '6', '8', 'Enter'])
    expect(snap().readout).toBe('LOCKER 04 · COLLECT')
    expect(snap().state).toBe('PARCEL READY / ENTER TO COLLECT')
    act(() => handle().press('Enter'))
    await run(400)
    expect(snap().readout).toBe('CODE · – – – –')
    expect(snap().state).toBe('PARCEL 04 COLLECTED / DOOR CLOSED')
  })

  it('Escape closes an open locker and returns the parcel', async () => {
    const { handle, run, snap } = await play(['2', '4', '6', '8', 'Enter'])
    act(() => handle().press('Escape'))
    await run(400)
    expect(snap().state).toBe('LOCKER 04 CLOSED / PARCEL RETURNED')
  })
})
