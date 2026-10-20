import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ComponentType, ReactNode } from 'react'
import type { ReducedMotionSetting, SoundCue } from '@youj/core'
import { FakeAudioContext, FakeOfflineAudioContext, LEAD_IN, installFakeAudio, testPack, useFreshPacks } from './test/fake-audio'

/* Sound is module state (one AudioContext per page, cooldowns, the lazily
 * fetched player, decoded packs), so each test loads the modules fresh. The
 * player is mocked through to itself, only to record when it's fetched. */

let restoreAudio: () => void
const fetched = vi.fn()

beforeEach(async () => {
  vi.resetModules()
  await useFreshPacks()
  fetched.mockClear()
  vi.doMock('./lib/player', async (importOriginal) => {
    fetched()
    return importOriginal()
  })
  restoreAudio = installFakeAudio()
})

afterEach(() => {
  restoreAudio()
  vi.doUnmock('./lib/player')
  vi.restoreAllMocks()
})

async function load() {
  const { YoujProvider, useSound, useSoundCue } = await import('@youj/core')
  const { loadPlayer } = await import('./lib/lazy')
  const player = () => import('./lib/player')
  /** A component that emits a cue, like a Button does. */
  function Pad({ cue = 'tap', label = cue }: { cue?: SoundCue; label?: string }) {
    const emit = useSoundCue()
    return (
      <button type="button" onClick={() => emit(cue)}>
        {label}
      </button>
    )
  }
  /** A settings row: the provider's state, and the user's mute. */
  function Settings() {
    const sound = useSound()
    return (
      <button type="button" data-enabled={sound.enabled} data-muted={sound.muted} data-volume={sound.volume} onClick={() => sound.setMuted(!sound.muted)}>
        Mute
      </button>
    )
  }
  function Motion({ reduced = 'never', children }: { reduced?: ReducedMotionSetting; children: ReactNode }) {
    return <YoujProvider reducedMotion={reduced}>{children}</YoujProvider>
  }
  return { YoujProvider, useSound, Pad: Pad as ComponentType<{ cue?: SoundCue; label?: string }>, Settings, Motion, loadPlayer, player }
}

const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }))
const context = () => FakeAudioContext.instances[0]
const played = () => context()?.sources.filter((s) => s.started).length ?? 0
/** Waits for the player and a pack's decode to land. */
const settle = async (pack: ReturnType<typeof testPack>, cues = 10) => {
  await waitFor(() => expect(pack.loads).toBe(1))
  await waitFor(() => expect(FakeOfflineAudioContext.decoded).toBeGreaterThanOrEqual(cues))
  await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
}

describe('YoujProvider sound', () => {
  test('is off by default: without it, a cue fetches nothing, decodes nothing and makes no AudioContext', async () => {
    const { Pad, Motion } = await load()
    const listen = vi.spyOn(window, 'addEventListener')
    render(
      <Motion>
        <Pad />
      </Motion>,
    )
    fireEvent.pointerDown(window, { pointerType: 'mouse' })
    press('tap')
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
    expect(fetched).not.toHaveBeenCalled()
    expect(FakeOfflineAudioContext.decoded).toBe(0)
    expect(FakeAudioContext.instances).toHaveLength(0)
    expect(listen.mock.calls.filter(([type]) => type === 'pointerdown' || type === 'keydown')).toEqual([])
  })

  test('decodes its pack as soon as it’s on, starts audio at the first gesture, and plays each sound from its first sample at the volume', async () => {
    restoreAudio()
    restoreAudio = installFakeAudio({ activated: false })
    const { YoujProvider, Pad, Motion } = await load()
    const pack = testPack()
    render(
      <Motion>
        <YoujProvider sound={{ pack, volume: 0.8 }}>
          <Pad />
        </YoujProvider>
      </Motion>,
    )
    await settle(pack)
    expect(fetched).toHaveBeenCalledTimes(1)
    // Decoded without a gesture, on an OfflineAudioContext; no AudioContext yet.
    expect(FakeAudioContext.instances).toHaveLength(0)
    press('tap')
    expect(FakeAudioContext.instances).toHaveLength(0)
    fireEvent.pointerDown(window, { pointerType: 'mouse' })
    expect(FakeAudioContext.instances).toHaveLength(1)
    press('tap')
    const [source] = context()!.sources
    // The decoder's 10 ms of lead-in is skipped (less a millisecond of lead), so the sound lands with its motion.
    expect(source!.started!.offset).toBeCloseTo(LEAD_IN / 48_000 - 0.001, 5)
    // Volume is squared, so the slider's middle sounds like the middle.
    expect(context()!.gains[0]!.gain.value).toBeCloseTo(0.8 ** 2)
  })

  test('useSound().play says whether it played: false while the pack loads, without a provider and when muted', async () => {
    const { YoujProvider, useSound, Motion } = await load()
    const results: boolean[] = []
    function Play() {
      const sound = useSound()
      return (
        <button type="button" onClick={() => results.push(sound.play('success'))}>
          Play
        </button>
      )
    }
    const pack = testPack()
    const { rerender } = render(
      <Motion>
        <Play />
      </Motion>,
    )
    press('Play')
    rerender(
      <Motion>
        <YoujProvider sound={pack}>
          <Play />
        </YoujProvider>
      </Motion>,
    )
    press('Play')
    await settle(pack)
    fireEvent.pointerDown(window, { pointerType: 'mouse' })
    press('Play')
    rerender(
      <Motion>
        <YoujProvider sound={{ pack, muted: true }}>
          <Play />
        </YoujProvider>
      </Motion>,
    )
    press('Play')
    expect(results).toEqual([false, false, true, false])
  })

  test('a muted provider downloads nothing; muting later silences it', async () => {
    const { YoujProvider, Pad, Motion, Settings } = await load()
    const pack = testPack()
    const { unmount } = render(
      <Motion>
        <YoujProvider sound={{ pack, muted: true }}>
          <Pad />
        </YoujProvider>
      </Motion>,
    )
    press('tap')
    await act(() => new Promise((resolve) => setTimeout(resolve, 20)))
    expect(fetched).not.toHaveBeenCalled()
    expect(pack.loads).toBe(0)
    unmount()

    render(
      <Motion>
        <YoujProvider sound={pack}>
          <Pad />
          <Pad cue="success" />
          <Settings />
        </YoujProvider>
      </Motion>,
    )
    await settle(pack)
    press('tap')
    expect(played()).toBe(1)
    press('Mute')
    expect(screen.getByRole('button', { name: 'Mute' })).toHaveAttribute('data-muted', 'true')
    press('success')
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)))
    expect(played()).toBe(1)
  })

  test('is silent under reduced motion, unless it plays anyway', async () => {
    const { YoujProvider, Pad, Motion } = await load()
    const pack = testPack()
    render(
      <YoujProvider sound={pack}>
        <Motion reduced="always">
          <Pad label="reduced" />
        </Motion>
        <YoujProvider sound={{ whenReduced: true }}>
          <Motion reduced="always">
            <Pad cue="success" label="anyway" />
          </Motion>
        </YoujProvider>
      </YoujProvider>,
    )
    await settle(pack)
    press('reduced')
    expect(played()).toBe(0)
    press('anyway')
    expect(played()).toBe(1)
  })

  test('a controlled mute is reported, and nothing changes until the app passes it back', async () => {
    const { YoujProvider, Settings } = await load()
    const onMutedChange = vi.fn()
    render(
      <YoujProvider sound={{ pack: testPack(), muted: false, onMutedChange }}>
        <Settings />
      </YoujProvider>,
    )
    press('Mute')
    expect(onMutedChange).toHaveBeenCalledWith(true)
    expect(screen.getByRole('button', { name: 'Mute' })).toHaveAttribute('data-muted', 'false')
  })

  test('nested providers inherit what they leave out; enabled={false} silences a subtree', async () => {
    const { YoujProvider, Pad, Settings, Motion } = await load()
    const pack = testPack()
    render(
      <Motion>
        <YoujProvider sound={{ pack, volume: 0.8 }}>
          <YoujProvider sound={{ volume: 0.4 }}>
            <Pad label="quieter" />
            <Settings />
          </YoujProvider>
          <YoujProvider sound={false}>
            <Pad label="silenced" />
          </YoujProvider>
        </YoujProvider>
      </Motion>,
    )
    await settle(pack)
    press('silenced')
    expect(played()).toBe(0)
    press('quieter')
    expect(played()).toBe(1)
    expect(context()!.gains[0]!.gain.value).toBeCloseTo(0.4 ** 2)
    // The mute is the user's, shared with the provider above.
    const mute = screen.getByRole('button', { name: 'Mute' })
    expect(mute).toHaveAttribute('data-volume', '0.4')
    fireEvent.click(mute)
    expect(mute).toHaveAttribute('data-muted', 'true')
  })

  test('a volume change doesn’t re-render the components that emit cues', async () => {
    const { YoujProvider } = await load()
    const { useSoundCue } = await import('@youj/core')
    const { useState } = await import('react')
    let renders = 0
    function Counted() {
      renders++
      useSoundCue()
      return null
    }
    const pack = testPack()
    let setVolume!: (volume: number) => void
    // The usual app shape: settings in state, the app passed through as children.
    function Providers({ children }: { children: ReactNode }) {
      const [volume, set] = useState(0.5)
      setVolume = set
      return (
        <YoujProvider sound={{ pack, volume }}>
          {children}
        </YoujProvider>
      )
    }
    render(
      <Providers>
        <Counted />
      </Providers>,
    )
    const before = renders
    act(() => setVolume(0.6))
    act(() => setVolume(0.7))
    // The cue sink is stable, so the context the components read doesn't change.
    expect(renders).toBe(before)
  })

  test('stops listening for the unlocking gesture when it unmounts', async () => {
    restoreAudio()
    restoreAudio = installFakeAudio({ activated: false })
    const { YoujProvider, Pad } = await load()
    const listen = vi.spyOn(window, 'addEventListener')
    const unlisten = vi.spyOn(window, 'removeEventListener')
    const { unmount } = render(
      <YoujProvider sound={testPack()}>
        <Pad />
      </YoujProvider>,
    )
    await waitFor(() => expect(listen).toHaveBeenCalledWith('pointerdown', expect.any(Function), expect.objectContaining({ capture: true })))
    unmount()
    expect(unlisten).toHaveBeenCalledWith('pointerdown', expect.any(Function), true)
    expect(unlisten).toHaveBeenCalledWith('keydown', expect.any(Function), true)
  })
})

describe('the player', () => {
  /** The player on a fake clock, its pack decoded. */
  async function player(sources = {}) {
    let now = 1000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const mod = await import('./lib/player')
    const pack = testPack(sources)
    await mod.load(pack)
    return { ...mod, pack, advance: (ms: number) => (now += ms) }
  }

  test('rate-limits: a cue can’t retrigger within its cooldown, and quick repeats play quieter', async () => {
    const { play, pack, advance } = await player()
    expect(play('tap', pack, 1)).toBe(true)
    advance(10)
    expect(play('tap', pack, 1)).toBe(false)
    // Another cue isn't held up by this one's cooldown.
    expect(play('select', pack, 1)).toBe(true)
    advance(60)
    expect(play('tap', pack, 1)).toBe(true)
    context()!.sources.forEach((s) => s.end())
    advance(60)
    expect(play('tap', pack, 1)).toBe(true)
    context()!.sources.forEach((s) => s.end())
    advance(1000)
    expect(play('tap', pack, 1)).toBe(true)
    const [first, select, second, third, fresh] = context()!.gains.map((g) => g.gain.value)
    expect(select).toBe(first)
    expect(second).toBeLessThan(first!)
    expect(third).toBeLessThan(second!)
    // After a pause, the next one is a new run at full level.
    expect(fresh).toBe(first)
  })

  test('plays at most four sounds at once, and makes room as they end', async () => {
    const { play, pack } = await player()
    const cues = ['tap', 'toggleOn', 'success', 'notify', 'error'] as const
    expect(cues.map((cue) => play(cue, pack, 1))).toEqual([true, true, true, true, false])
    context()!.sources[0]!.end()
    expect(play('error', pack, 1)).toBe(true)
  })

  test('waits for a user gesture before it creates an AudioContext', async () => {
    restoreAudio()
    restoreAudio = installFakeAudio({ activated: false })
    const { play, arm, pack } = await player()
    expect(play('tap', pack, 1)).toBe(false)
    const disarm = arm(pack)
    // Escape and a touch's press don't activate a page; a mouse press (a touch's release, a key) does.
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.pointerDown(window, { pointerType: 'touch' })
    expect(FakeAudioContext.instances).toHaveLength(0)
    fireEvent.pointerDown(window, { pointerType: 'mouse' })
    expect(FakeAudioContext.instances).toHaveLength(1)
    expect(play('tap', pack, 1)).toBe(true)
    disarm()
  })

  test('is silent while the tab is hidden, and suspends the context', async () => {
    const { play, pack } = await player()
    expect(play('tap', pack, 1)).toBe(true)
    let visibility: DocumentVisibilityState = 'hidden'
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(context()!.state).toBe('suspended')
    expect(play('select', pack, 1)).toBe(false)
    visibility = 'visible'
    document.dispatchEvent(new Event('visibilitychange'))
    expect(context()!.state).toBe('running')
    expect(play('select', pack, 1)).toBe(true)
    delete (document as { visibilityState?: unknown }).visibilityState
  })

  test('a file that won’t decode leaves only its own cue silent', async () => {
    const { play, pack } = await player({ error: Uint8Array.from([0xff, 0xff, 0, 0]) })
    expect(play('error', pack, 1)).toBe(false)
    expect(play('success', pack, 1)).toBe(true)
  })

  test('fetches a pack’s URLs, and retries a pack whose load failed', async () => {
    const { fakeFile } = await import('./test/fake-audio')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(fakeFile()))
    const { load, play } = await import('./lib/player')
    let fail = true
    const { pack } = await import('./lib/pack')
    const flaky = pack({
      name: 'flaky',
      load: async () => {
        if (fail) throw new Error('offline')
        return { tap: '/sounds/tap.mp3' }
      },
    })
    await expect(load(flaky)).rejects.toThrow('offline')
    fail = false
    await load(flaky)
    expect(fetchMock).toHaveBeenCalledWith('/sounds/tap.mp3')
    expect(play('tap', flaky, 1)).toBe(true)
  })

  test('drops a cue until its pack is decoded, rather than playing it late', async () => {
    const { play } = await import('./lib/player')
    const pack = testPack()
    expect(play('tap', pack, 1)).toBe(false)
    await waitFor(() => expect(pack.loads).toBe(1))
  })
})
