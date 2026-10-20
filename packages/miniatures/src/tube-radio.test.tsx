import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureTubeRadio, type MiniatureTubeRadioKey, tubeRadio } from './tube-radio'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureTubeRadio, tubeRadio)

describe('TubeRadio', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureTubeRadioKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureTubeRadio, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts off, tuned to 945 kHz on the medium wave at volume six', async () => {
    const { snap } = await play()
    expect(snap()).toEqual(tubeRadio.initial)
  })

  it('O switches it on to static between stations', async () => {
    const { snap } = await play(['o'])
    expect(snap().state).toBe('STATIC · NO STATION')
    expect(snap().readout).toBe('MW 945 kHz · VOL 6')
  })

  it.each([
    ['1', 'LW 203 kHz · VOL 6'],
    ['2', 'MW 945 kHz · VOL 6'],
    ['3', 'SW 12.10 MHz · VOL 6'],
    ['4', 'FM 95.5 MHz · VOL 6'],
  ] as const)('%s selects the band: %s', async (key, readout) => {
    const { snap } = await play(['o', key])
    expect(snap().readout).toBe(readout)
  })

  it('the left and right arrows tune the dial', async () => {
    const left = await play(['ArrowLeft'])
    expect(left.snap().readout).toBe('MW 941 kHz · VOL 6')
    cleanup()
    const right = await play(['ArrowRight'])
    expect(right.snap().readout).toBe('MW 949 kHz · VOL 6')
  })

  it('S seeks the next station', async () => {
    const { snap } = await play(['o', 's'])
    expect(snap().readout).toBe('MW 989 kHz · VOL 6')
    expect(snap().state).toBe('TUNED · PARIS')
  })

  it('the up and down arrows set the volume', async () => {
    const up = await play(['ArrowUp'])
    expect(up.snap().readout).toBe('MW 945 kHz · VOL 7')
    cleanup()
    const down = await play(['ArrowDown'])
    expect(down.snap().readout).toBe('MW 945 kHz · VOL 5')
  })
})
