import { act } from '@testing-library/react'
import { vi } from 'vitest'

/* A browser the tests can steer: the OS's reduced-motion and color-scheme
 * preferences (with change events, as a real MediaQueryList fires them), a
 * recording AudioContext, and frames driven by fake time. */

const os = { reduce: false, dark: false }
const lists = new Set<{ query: string; listeners: Set<(e: { matches: boolean }) => void> }>()
const answer = (query: string) => (query.includes('prefers-reduced-motion') ? os.reduce !== query.includes('no-preference') : query.includes('prefers-color-scheme') ? os.dark === query.includes('dark') : false)

// Only where there's a DOM: server.test.tsx runs without one.
if (typeof window !== 'undefined') window.matchMedia = (query: string) => {
  const list = { query, listeners: new Set<(e: { matches: boolean }) => void>() }
  lists.add(list)
  return {
    media: query,
    get matches() {
      return answer(query)
    },
    onchange: null,
    addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => list.listeners.add(fn),
    removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) => list.listeners.delete(fn),
    addListener: (fn: (e: { matches: boolean }) => void) => list.listeners.add(fn),
    removeListener: (fn: (e: { matches: boolean }) => void) => list.listeners.delete(fn),
    dispatchEvent: () => true,
  } as unknown as MediaQueryList
}

/** Sets the OS preferences and tells every MediaQueryList, as a browser does. */
export function setMedia(next: Partial<typeof os>) {
  Object.assign(os, next)
  act(() => {
    for (const list of lists) for (const fn of list.listeners) fn({ matches: answer(list.query) })
  })
}

export function resetMedia() {
  os.reduce = false
  os.dark = false
}

/** Media listeners still registered: a figure that unmounted cleanly leaves none of its own. */
export const mediaListenerCount = () => [...lists].reduce((n, l) => n + l.listeners.size, 0)

/** A Web Audio stand-in that records what was created. */
export function installAudio() {
  const created: FakeAudioContext[] = []
  class FakeNode {
    gain = { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} }
    frequency = { value: 0, setValueAtTime() {}, setTargetAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }
    playbackRate = { value: 1, setTargetAtTime() {} }
    Q = { value: 0 }
    type = ''
    buffer: unknown = null
    loop = false
    loopStart = 0
    loopEnd = 0
    connect() {
      return this
    }
    disconnect() {}
    start() {}
    stop() {}
  }
  class FakeAudioContext {
    state: AudioContextState = 'running'
    currentTime = 0
    sampleRate = 22050
    destination = new FakeNode()
    constructor() {
      created.push(this)
    }
    createGain = () => new FakeNode()
    createOscillator = () => new FakeNode()
    createBiquadFilter = () => new FakeNode()
    createBufferSource = () => new FakeNode()
    createDynamicsCompressor = () => new FakeNode()
    createBuffer = (_c: number, length: number) => ({ getChannelData: () => new Float32Array(length) })
    resume = vi.fn(async () => {
      this.state = 'running'
    })
    suspend = vi.fn(async () => {
      this.state = 'suspended'
    })
    close = vi.fn(async () => {
      this.state = 'closed'
    })
  }
  const w = window as unknown as Record<string, unknown>
  w.AudioContext = FakeAudioContext
  return {
    created,
    uninstall: () => {
      delete w.AudioContext
    },
  }
}

/** Fake time for frames and the clock; returns `run(ms)`, which advances it inside act(). */
export function useFrames() {
  vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
  return async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms)
    })
  }
}

/** Replaces `Math.random` with a seeded sequence (restored by `vi.restoreAllMocks()`), for figures that scatter things at random. */
export function seedRandom(seed = 1) {
  let a = seed
  vi.spyOn(Math, 'random').mockImplementation(() => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  })
}
