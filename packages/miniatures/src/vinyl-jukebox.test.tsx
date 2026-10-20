import { act, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MiniatureVinylJukebox, type MiniatureVinylJukeboxKey, vinylJukebox } from './vinyl-jukebox'
import { useFrames } from './test/browser'
import { describeMiniature, mount } from './test/miniature-suite'

describeMiniature(MiniatureVinylJukebox, vinylJukebox)

describe('VinylJukebox', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  /** Mounts it still, presses the keys in order and lets it settle. */
  const play = async (keys: MiniatureVinylJukeboxKey[] = [], settle = 400) => {
    const run = useFrames()
    const view = mount(MiniatureVinylJukebox, { reducedMotion: 'always' })
    await run(100)
    for (const k of keys) act(() => view.handle().press(k))
    await run(settle)
    return { ...view, run, snap: () => view.handle().getSnapshot() }
  }

  it('starts idle with three credits and the volume at six', async () => {
    const { snap, svg } = await play([], 0)
    expect(snap()).toEqual(vinylJukebox.initial)
    expect(svg()).not.toHaveClass('has')
  })

  it.each([
    ['1', 'COSMIC MILKSHAKE'],
    ['0', 'NEON NOODLE'],
  ] as const)('%s picks a song, spends a credit and plays it', async (key, title) => {
    const { snap } = await play([key])
    expect(snap().readout).toBe(`${key} · ${title}`)
    expect(snap().state).toBe('PLAYING 0:00 · VOL 6 · 2 CREDITS')
  })

  it('Space rejects the playing record and the jukebox returns to idle', async () => {
    const { handle, run, snap } = await play(['1'])
    act(() => handle().press(' '))
    await run(1500)
    expect(snap().readout).toBe('SELECT 1–0')
    expect(snap().state).toMatch(/^IDLE/)
  })

  it('C adds a credit', async () => {
    const { snap, svg } = await play(['c'])
    expect(snap().state).toBe('IDLE · VOL 6 · 4 CREDITS')
    expect(svg()).toHaveClass('has')
  })

  it('the up and down arrows change the volume', async () => {
    const up = await play(['ArrowUp'])
    expect(up.snap().state).toBe('IDLE · VOL 7 · 3 CREDITS')
    cleanup()
    const down = await play(['ArrowDown'])
    expect(down.snap().state).toBe('IDLE · VOL 5 · 3 CREDITS')
  })
})
