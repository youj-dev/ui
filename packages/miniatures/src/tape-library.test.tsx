import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureTapeLibrary, type MiniatureTapeLibraryKey, tapeLibrary } from './tape-library'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureTapeLibrary, tapeLibrary)

describe('TapeLibrary', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureTapeLibraryKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureTapeLibrary, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts idle with ten tapes in their slots and the drives empty', async () => {
    const { snap, svg } = await play([], 0)
    expect(snap().readout).toBe(tapeLibrary.initial.readout)
    expect(snap().state).toBe('IDLE · 10 TAPES IN SLOTS')
    expect(svg()).toHaveClass('lit')
  })

  it.each(['1', '2', '5', '9', '0'] as const)('%s fetches that tape into a drive and starts reading it', async (key) => {
    const { snap } = await play([key])
    const n = key === '0' ? '10' : `0${key}`
    expect(snap().state).toMatch(new RegExp(`^READING TAPE ${n} · \\d+%$`))
    expect(snap().readout).toMatch(/^1\/2 DRIVES · \d+ MB\/s$/)
  })

  it('U unloads the drives', async () => {
    const { handle, run, snap } = await play(['1'])
    expect(snap().readout).toMatch(/^1\/2 DRIVES/)
    act(() => handle().press('u'))
    await run(1000)
    expect(snap().readout).toBe('0/2 DRIVES · 0 MB/s')
  })

  it('U with the drives empty says so', async () => {
    const { snap } = await play(['u'])
    expect(snap().state).toBe('DRIVES EMPTY')
  })

  it('S runs an inventory of the slots', async () => {
    const { snap } = await play(['s'])
    expect(snap().state).toBe('INVENTORY OK · 10 SLOTS')
  })

  it('L switches the interior light off and on', async () => {
    const { handle, run, snap, svg } = await play(['l'])
    expect(snap().state).toBe('LIGHT OFF')
    expect(svg()).not.toHaveClass('lit')
    act(() => handle().press('l'))
    await run(400)
    expect(svg()).toHaveClass('lit')
  })
})
