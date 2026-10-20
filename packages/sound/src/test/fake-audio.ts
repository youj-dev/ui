import type { SoundCue } from '@youj/core'
import { pack, type SoundPack, type SoundSources } from '../lib/pack'

/* A recording stand-in for the Web Audio API, which jsdom lacks: it keeps
 * every buffer source a sound starts (where it starts, how loud), decodes
 * fake files, and lets a test end a sound as the audio thread would. */

class FakeNode {
  connected: unknown[] = []
  connect<T>(node: T): T {
    this.connected.push(node)
    return node
  }
  disconnect() {
    this.connected = []
  }
}

export class FakeGain extends FakeNode {
  gain = { value: 1 }
}

export class FakeAudioBuffer {
  sampleRate = 48_000
  numberOfChannels = 1
  constructor(private readonly data: Float32Array) {}
  get length() {
    return this.data.length
  }
  getChannelData() {
    return this.data
  }
}

export class FakeSource extends FakeNode {
  buffer: FakeAudioBuffer | null = null
  onended: (() => void) | null = null
  started?: { when: number; offset: number }
  start(when = 0, offset = 0) {
    this.started = { when, offset }
  }
  stop() {}
  /** Ends the sound, as the audio thread does once it has played. */
  end() {
    this.onended?.()
  }
}

export class FakeAudioContext {
  static instances: FakeAudioContext[] = []
  state: 'running' | 'suspended' | 'closed' = 'running'
  currentTime = 0
  destination = new FakeNode()
  gains: FakeGain[] = []
  sources: FakeSource[] = []
  constructor() {
    FakeAudioContext.instances.push(this)
  }
  createGain() {
    const node = new FakeGain()
    this.gains.push(node)
    return node
  }
  createBufferSource() {
    const node = new FakeSource()
    this.sources.push(node)
    return node
  }
  resume() {
    this.state = 'running'
    return Promise.resolve()
  }
  suspend() {
    this.state = 'suspended'
    return Promise.resolve()
  }
}

/** Decodes a fake file: each byte is a sample, (b − 128) / 128. A file that starts 0xFF 0xFF won't decode, nor will a web page ("<"). */
export class FakeOfflineAudioContext {
  static decoded = 0
  decodeAudioData(bytes: ArrayBuffer) {
    const view = new Uint8Array(bytes)
    if ((view[0] === 0xff && view[1] === 0xff) || view[0] === 0x3c) return Promise.reject(new DOMException('Unable to decode audio data', 'EncodingError'))
    FakeOfflineAudioContext.decoded++
    return Promise.resolve(new FakeAudioBuffer(Float32Array.from(view, (b) => (b - 128) / 128)))
  }
}

/** Installs the fakes as the page's Web Audio, and says whether the page has had a user gesture. Returns the cleanup. */
export function installFakeAudio({ activated = true } = {}) {
  FakeAudioContext.instances = []
  FakeOfflineAudioContext.decoded = 0
  const globals = globalThis as { AudioContext?: unknown; OfflineAudioContext?: unknown }
  const saved = { AudioContext: globals.AudioContext, OfflineAudioContext: globals.OfflineAudioContext, activation: Object.getOwnPropertyDescriptor(navigator, 'userActivation') }
  globals.AudioContext = FakeAudioContext
  globals.OfflineAudioContext = FakeOfflineAudioContext
  Object.defineProperty(navigator, 'userActivation', { configurable: true, value: { hasBeenActive: activated, isActive: activated } })
  return () => {
    globals.AudioContext = saved.AudioContext
    globals.OfflineAudioContext = saved.OfflineAudioContext
    if (saved.activation) Object.defineProperty(navigator, 'userActivation', saved.activation)
    else delete (navigator as { userActivation?: unknown }).userActivation
  }
}

/** 10 ms of silence, as an MP3 decoder pads the front, then the sound: a spike that decays. */
export const LEAD_IN = 480
export const fakeFile = (level = 255) => Uint8Array.from({ length: LEAD_IN + 64 }, (_, i) => (i < LEAD_IN ? 128 : Math.round(128 + (level - 128) * 0.9 ** (i - LEAD_IN))))

/** A pack of fake files, counting its loads. */
let make = pack

/** After `vi.resetModules()`, builds test packs on the fresh modules a test imports, so their player is that test's. */
export async function useFreshPacks() {
  make = (await import('../lib/pack')).pack
}

export function testPack(sources: SoundSources = {}, cues: readonly SoundCue[] = ['tap', 'select', 'toggleOn', 'toggleOff', 'success', 'error', 'notify', 'open', 'close', 'tick']) {
  let loads = 0
  const own = make({
    name: 'test',
    load: async () => {
      loads++
      return { ...Object.fromEntries(cues.map((cue) => [cue, fakeFile()])), ...sources }
    },
  })
  return Object.defineProperty(own, 'loads', { get: () => loads }) as SoundPack & { readonly loads: number }
}
