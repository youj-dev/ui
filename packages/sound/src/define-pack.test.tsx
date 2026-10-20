import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { ReducedMotionSetting, SoundCue } from '@youj/core'
import { FakeAudioContext, type FakeSource, LEAD_IN, fakeFile, installFakeAudio, testPack, useFreshPacks } from './test/fake-audio'

/* definePack: your sounds over a base pack. The cues it leaves out, and any
 * file that won't load or decode, play the base's; the base loads only then.
 * Sound is module state (decoded packs, cooldowns), so each test loads the
 * modules fresh. fakeFile(level) carries its level in its first sample, so a
 * test can tell whose file played: the base's are 255, a pack's own 200. */

let restoreAudio: () => void
const imported = vi.fn()

beforeEach(async () => {
  vi.resetModules()
  await useFreshPacks()
  imported.mockClear()
  // Records when a candidate's audio is fetched: only once a pack that plays it turns sound on.
  vi.doMock('./candidates/tap.wood', async (importOriginal) => {
    imported()
    return importOriginal()
  })
  restoreAudio = installFakeAudio()
})

afterEach(() => {
  restoreAudio()
  vi.doUnmock('./candidates/tap.wood')
  vi.restoreAllMocks()
})

const OWN = 200
const BASE = 255
const levelOf = (source: FakeSource) => Math.round(source.buffer!.getChannelData()[LEAD_IN]! * 128 + 128)
const context = () => FakeAudioContext.instances[0]!
/** The level of each sound started so far. */
const heard = () => context().sources.map(levelOf)
const every: SoundCue[] = ['tap', 'select', 'toggleOn', 'toggleOff', 'success', 'error', 'notify', 'open', 'close', 'tick']

async function modules() {
  const { definePack } = await import('./lib/define-pack')
  const { candidates } = await import('./candidates')
  const player = await import('./lib/player')
  return { definePack, candidates, ...player }
}

/** Plays each cue once, far enough apart that no cooldown or voice cap gets in the way. */
function playEach(play: (cue: SoundCue, pack: never, volume: number) => boolean, pack: unknown, cues: SoundCue[]) {
  let now = 1000
  vi.spyOn(performance, 'now').mockImplementation(() => (now += 1000))
  return cues.map((cue) => {
    const played = play(cue, pack as never, 1)
    context()?.sources.forEach((s) => s.end())
    return played
  })
}

describe('definePack', () => {
  test('plays the cues it names from its own files, and every other cue from the base', async () => {
    const { definePack, load, play } = await modules()
    const base = testPack()
    const pack = definePack({ base, sounds: { tap: fakeFile(OWN) } })
    await load(pack)
    expect(playEach(play, pack, ['tap', 'select', 'error'])).toEqual([true, true, true])
    expect(heard()).toEqual([OWN, BASE, BASE])
    expect(base.loads).toBe(1)
  })

  test('never loads the base when it names every cue', async () => {
    const { definePack, load, play } = await modules()
    const base = testPack()
    const pack = definePack({ base, sounds: Object.fromEntries(every.map((cue) => [cue, fakeFile(OWN)])) })
    await load(pack)
    expect(playEach(play, pack, every).every(Boolean)).toBe(true)
    expect(new Set(heard())).toEqual(new Set([OWN]))
    expect(base.loads).toBe(0)
  })

  test('fetches URLs (a path or a URL object), and waits for loaders, using a module’s default', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(fakeFile(OWN)))
    const { definePack, load, play } = await modules()
    const pack = definePack({
      base: testPack(),
      sounds: {
        tap: '/sounds/tap.mp3',
        select: new URL('https://cdn.example.com/select.wav'),
        success: async () => ({ default: '/sounds/success.mp3' }),
        error: async () => fakeFile(OWN),
      },
    })
    expect(fetchMock).not.toHaveBeenCalled()
    await load(pack)
    expect(fetchMock).toHaveBeenCalledWith('/sounds/tap.mp3')
    expect(fetchMock).toHaveBeenCalledWith(new URL('https://cdn.example.com/select.wav'))
    expect(fetchMock).toHaveBeenCalledWith('/sounds/success.mp3')
    expect(playEach(play, pack, ['tap', 'select', 'success', 'error'])).toEqual([true, true, true, true])
    expect(heard()).toEqual([OWN, OWN, OWN, OWN])
  })

  test('a file that won’t load or decode plays the base’s instead, and development says why', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
      String(url) === '/missing.mp3' ? new Response('Not found', { status: 404 }) : new Response('<!doctype html><title>Home</title>'),
    )
    const { definePack, load, play } = await modules()
    const pack = definePack({
      name: 'studio',
      base: testPack(),
      sounds: { tap: '/missing.mp3', notify: '/app-route', error: Uint8Array.from([0xff, 0xff, 0, 0]), select: fakeFile(OWN) },
    })
    await load(pack)
    expect(playEach(play, pack, ['tap', 'notify', 'error', 'select'])).toEqual([true, true, true, true])
    expect(heard()).toEqual([BASE, BASE, BASE, OWN])
    const said = warn.mock.calls.map(([message]) => String(message))
    expect(said).toContainEqual(expect.stringContaining("studio: tap didn't load (HTTP 404 from /missing.mp3), so test's plays instead."))
    expect(said).toContainEqual(expect.stringContaining("studio: notify won't decode (it's a page, not audio: check the path)"))
    expect(said).toContainEqual(expect.stringContaining("studio: error won't decode (this browser can't read it; MP3 and WAV play everywhere)"))
    expect(said).toHaveLength(3)
  })

  test('a loader that fails, or gives something that isn’t a file, leaves its cue to the base', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { definePack, load, play } = await modules()
    const pack = definePack({
      base: testPack(),
      sounds: {
        tap: async () => {
          throw new Error('offline')
        },
        select: (async () => ({ src: '/tap.mp3' })) as never,
      },
    })
    await load(pack)
    expect(playEach(play, pack, ['tap', 'select'])).toEqual([true, true])
    expect(heard()).toEqual([BASE, BASE])
    expect(warn.mock.calls.map(([message]) => String(message))).toEqual([
      expect.stringContaining("custom: tap didn't load (offline)"),
      expect.stringContaining("custom: select's loader gave an object, not a URL or bytes"),
    ])
  })

  test('warns as it’s defined about a cue that doesn’t exist and a source of the wrong kind, and skips both', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { definePack } = await modules()
    const pack = definePack({ base: testPack(), sounds: { tapp: '/tap.mp3', select: 42, tap: '/tap.mp3' } as never })
    expect(warn.mock.calls.map(([message]) => String(message))).toEqual([
      expect.stringContaining('custom: "tapp" isn\'t a cue'),
      expect.stringContaining('custom: select is a number, not a URL, bytes or a function that loads one'),
    ])
    expect(await pack.load()).toEqual({ tap: '/tap.mp3' })
  })

  test('plays built-in candidates beside files of your own, loading each candidate only then', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(fakeFile(OWN)))
    const { definePack, candidates, load, play } = await modules()
    const pack = definePack({ base: testPack(), sounds: { tap: candidates.tap.wood, error: '/sounds/error.wav' } })
    expect(imported).not.toHaveBeenCalled()
    const sources = (await pack.load()) as Record<string, Uint8Array | string>
    expect(imported).toHaveBeenCalledTimes(1)
    // The candidate is the package's own MP3 (an MPEG frame's sync word first).
    expect(sources.tap).toBeInstanceOf(Uint8Array)
    expect((sources.tap as Uint8Array)[0]).toBe(0xff)
    expect(sources.error).toBe('/sounds/error.wav')
    await load(pack)
    expect(fetchMock).toHaveBeenCalledWith('/sounds/error.wav')
    expect(playEach(play, pack, ['tap', 'error', 'notify'])).toEqual([true, true, true])
  })

  test('packs that share a base decode it once', async () => {
    const { definePack, load } = await modules()
    const base = testPack()
    await Promise.all([load(definePack({ base, sounds: { tap: fakeFile(OWN) } })), load(definePack({ base, sounds: { error: fakeFile(OWN) } }))])
    expect(base.loads).toBe(1)
  })

  test('defaults to the Glass pack as its base', async () => {
    const { definePack } = await modules()
    const { beacon } = await import('./packs')
    expect(definePack({ sounds: {} }).base).toBe(beacon)
  })
})

describe('definePack under YoujProvider', () => {
  async function app() {
    const { definePack, candidates } = await import('./index')
    const { YoujProvider, useSoundCue } = await import('@youj/core')
    function Pad({ cue = 'tap' }: { cue?: SoundCue }) {
      const emit = useSoundCue()
      return (
        <button type="button" onClick={() => emit(cue)}>
          {cue}
        </button>
      )
    }
    function Motion({ reduced = 'never', children }: { reduced?: ReducedMotionSetting; children: ReactNode }) {
      return <YoujProvider reducedMotion={reduced}>{children}</YoujProvider>
    }
    return { YoujProvider, definePack, candidates, Pad, Motion }
  }
  const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

  test('costs nothing until sound is on: a muted provider loads no file, no candidate and no base', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const { YoujProvider, definePack, candidates, Pad, Motion } = await app()
    const base = testPack()
    const pack = definePack({ base, sounds: { tap: candidates.tap.wood, error: '/sounds/error.wav' } })
    const { rerender } = render(
      <Motion>
        <YoujProvider sound={{ pack, muted: true }}>
          <Pad />
        </YoujProvider>
      </Motion>,
    )
    press('tap')
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(imported).not.toHaveBeenCalled()
    expect(base.loads).toBe(0)

    fetchMock.mockImplementation(async () => new Response(fakeFile(OWN)))
    rerender(
      <Motion>
        <YoujProvider sound={pack}>
          <Pad />
        </YoujProvider>
      </Motion>,
    )
    await waitFor(() => expect(base.loads).toBe(1))
    expect(imported).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/sounds/error.wav')
  })

  test('is silent under reduced motion like any pack, unless the provider plays anyway', async () => {
    const { YoujProvider, definePack, Pad, Motion } = await app()
    const base = testPack()
    const pack = definePack({ base, sounds: { tap: fakeFile(OWN) } })
    render(
      <YoujProvider sound={pack}>
        <Motion reduced="always">
          <Pad />
        </Motion>
        <YoujProvider sound={{ whenReduced: true }}>
          <Motion reduced="always">
            <Pad cue="select" />
          </Motion>
        </YoujProvider>
      </YoujProvider>,
    )
    await waitFor(() => expect(base.loads).toBe(1))
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
    press('tap')
    expect(FakeAudioContext.instances[0]?.sources.length ?? 0).toBe(0)
    press('select')
    expect(heard()).toEqual([BASE])
  })
})
