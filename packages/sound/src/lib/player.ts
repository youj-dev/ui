import type { SoundCue } from '@youj/core'
import type { SoundFile, SoundPack, SoundSources } from './pack'
import { DEV, reason, warn } from './warn'

/* The engine behind a pack's `arm` and `play`. Apps load it lazily (lazy.ts), and only
 * while sound is on, so an app that never turns sound on never downloads it.
 *
 * - Decoding: a pack's files are decoded as soon as sound turns on, on an
 *   OfflineAudioContext (which needs no user gesture and warns about none),
 *   once per pack. MP3 decoders disagree about the silence before a file's
 *   first sample, so each sound's own start is found once and it plays from
 *   there, in step with its motion.
 * - A pack with a `base` (definePack's) takes from it every cue it leaves
 *   out or whose file won't load or decode, and loads the base only then.
 * - One AudioContext for the page, created only once the page has had a
 *   user gesture (the browsers' autoplay rule): at the first press or key
 *   after arm(), or later when navigator.userActivation says one happened.
 *   Before that, play() is a no-op.
 * - Silent while the tab is hidden, and the context is suspended then, and
 *   after half a minute without a sound, so it holds no audio device idle.
 * - Rate-limited: a cue can't retrigger within its cooldown, quick repeats of
 *   one cue get quieter (a held arrow key ticks, it doesn't hammer), and at
 *   most four sounds play at once. */

/** Per cue, ms: the same cue can't play again sooner (key repeat, a flood of toasts). */
const COOLDOWN: Record<SoundCue, number> = {
  tap: 45,
  select: 45,
  tick: 30,
  toggleOn: 70,
  toggleOff: 70,
  open: 150,
  close: 150,
  notify: 150,
  success: 300,
  error: 300,
}
/** Sounds playing at once; more are dropped. */
const MAX_VOICES = 4
/** Repeats of one cue closer than this form a run, and each one in a run plays quieter. */
const RUN_MS = 320
const RUN_DECAY = 0.72
const RUN_FLOOR = 0.3
/** Idle time before the context is suspended. */
const IDLE_MS = 30_000
/** A sound starts at its first sample within this many dB of its peak, less a millisecond of lead. */
const ONSET_DB = -50
const LEAD = 0.001

interface Voice {
  buffer: AudioBuffer
  /** Seconds of lead-in to skip. */
  offset: number
}
type Bank = Map<SoundCue, Voice>

const loading = new WeakMap<SoundPack, Promise<Bank>>()
const banks = new WeakMap<SoundPack, Bank>()

let ctx: AudioContext | undefined
let activated = false
let voices = 0
let idle: ReturnType<typeof setTimeout> | undefined
const lastPlayed = new Map<SoundCue, number>()
const runs = new Map<SoundCue, number>()

/** Where the sound really starts: MP3 decoders pad the front with a different amount of silence each. */
function onset(buffer: AudioBuffer): number {
  const data = buffer.getChannelData(0)
  let top = 0
  for (let i = 0; i < data.length; i++) top = Math.max(top, Math.abs(data[i]!))
  const threshold = top * 10 ** (ONSET_DB / 20)
  let first = 0
  while (first < data.length && Math.abs(data[first]!) <= threshold) first++
  return Math.max(0, first / buffer.sampleRate - LEAD)
}

/** A copy of the bytes: decodeAudioData takes ownership of the buffer it's given. */
async function bytesOf(source: SoundFile): Promise<ArrayBuffer> {
  if (typeof source === 'string' || source instanceof URL) {
    const response = await fetch(source)
    if (!response.ok) throw new Error(`HTTP ${response.status} from ${source}`)
    return response.arrayBuffer()
  }
  if (source instanceof ArrayBuffer) return source.slice(0)
  return source.slice().buffer as ArrayBuffer
}

/** Why a file didn't decode: a page served in its place (a wrong path), or a format this browser can't read. */
function undecodable(data: ArrayBuffer) {
  const first = new Uint8Array(data, 0, Math.min(64, data.byteLength)).find((byte) => byte > 0x20)
  return first === 0x3c || first === 0x7b ? "it's a page, not audio: check the path" : "this browser can't read it; MP3 and WAV play everywhere"
}

async function decode(sources: SoundSources, pack: SoundPack): Promise<Bank> {
  const decoder = new OfflineAudioContext(1, 1, 48_000)
  const bank: Bank = new Map()
  // A file that won't load or decode leaves its cue to the base pack, or silent without one; the rest still play.
  const instead = () => (pack.base ? `so ${pack.base.name}'s plays instead` : 'so it stays silent')
  await Promise.all(
    (Object.entries(sources) as [SoundCue, SoundFile][]).map(async ([cue, source]) => {
      let data: ArrayBuffer
      try {
        data = await bytesOf(source)
      } catch (error) {
        if (DEV) warn(`${pack.name}: ${cue} didn't load (${reason(error)}), ${instead()}.`)
        return
      }
      // Read before decoding, which takes the bytes.
      const why = DEV && undecodable(data)
      try {
        const buffer = await decoder.decodeAudioData(data)
        bank.set(cue, { buffer, offset: onset(buffer) })
      } catch {
        if (DEV) warn(`${pack.name}: ${cue} won't decode (${why}), ${instead()}.`)
      }
    }),
  )
  return bank
}

/** Loads and decodes a pack once, with its base's sounds for the cues it lacks. A failed load is retried by the next caller. */
export function load(pack: SoundPack): Promise<Bank> {
  let pending = loading.get(pack)
  if (!pending) {
    pending = pack
      .load()
      .then((sources) => decode(sources, pack))
      .then(async (bank) => {
        const missing = (Object.keys(COOLDOWN) as SoundCue[]).filter((cue) => !bank.has(cue))
        if (pack.base && pack.base !== pack && missing.length) {
          const base = await load(pack.base).catch(() => undefined)
          for (const cue of missing) {
            const voice = base?.get(cue)
            if (voice) bank.set(cue, voice)
          }
          // The base didn't load (offline, say): play what there is, and try again at the next cue it would play.
          if (!base) loading.delete(pack)
        }
        banks.set(pack, bank)
        return bank
      })
    pending.catch(() => loading.delete(pack))
    loading.set(pack, pending)
  }
  return pending
}

function onVisibility() {
  if (!ctx) return
  if (document.visibilityState === 'hidden') void ctx.suspend().catch(() => {})
  else void ctx.resume().catch(() => {})
}

/** The page's context, created or resumed, or undefined while the browser won't allow sound yet. */
function context(): AudioContext | undefined {
  if (!ctx) {
    const hasBeenActive = (navigator as { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive
    if (!(activated || hasBeenActive) || typeof AudioContext === 'undefined') return undefined
    ctx = new AudioContext({ latencyHint: 'interactive' })
    document.addEventListener('visibilitychange', onVisibility)
  }
  if (ctx.state !== 'running' && ctx.state !== 'closed') void ctx.resume().catch(() => {})
  clearTimeout(idle)
  idle = setTimeout(() => void ctx?.suspend().catch(() => {}), IDLE_MS)
  return ctx
}

/**
 * Plays a cue from a pack at a volume (0–1, on a perceptual curve). Returns
 * false when nothing played: the pack isn't decoded yet, no user gesture
 * yet, the tab is hidden, the cue just played, or four sounds already are.
 */
export function play(cue: SoundCue, pack: SoundPack, volume: number): boolean {
  if (typeof document === 'undefined' || document.visibilityState === 'hidden' || volume <= 0) return false
  const voice = banks.get(pack)?.get(cue)
  if (!voice) {
    // Not decoded yet (or the pack has no such sound): a late sound would miss its motion.
    load(pack).catch(() => {})
    return false
  }
  const now = performance.now()
  const last = lastPlayed.get(cue)
  if ((last !== undefined && now - last < (COOLDOWN[cue] ?? 0)) || voices >= MAX_VOICES) return false
  const audio = context()
  if (!audio) return false
  const run = last !== undefined && now - last < RUN_MS ? (runs.get(cue) ?? 0) + 1 : 0
  runs.set(cue, run)
  lastPlayed.set(cue, now)
  const source = audio.createBufferSource()
  const gain = audio.createGain()
  source.buffer = voice.buffer
  // Squared, so the slider's middle sounds like the middle.
  gain.gain.value = Math.min(volume, 1) ** 2 * Math.max(RUN_FLOOR, RUN_DECAY ** run)
  source.connect(gain).connect(audio.destination)
  voices++
  source.onended = () => {
    voices--
    gain.disconnect()
  }
  source.start(0, voice.offset)
  return true
}

let armed = 0

/**
 * A gesture after arming, in the capture phase, before any handler plays:
 * the moment the browser allows sound. A mouse activates the page on press;
 * touch and pen on release; any key but Escape.
 */
function unlock(event: Event) {
  if (event.type === 'pointerdown' && (event as PointerEvent).pointerType !== 'mouse') return
  if (event.type === 'pointerup' && (event as PointerEvent).pointerType === 'mouse') return
  if (event.type === 'keydown' && (event as KeyboardEvent).key === 'Escape') return
  activated = true
  context()
  if (ctx?.state === 'running') disarmAll()
}

const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'keydown'] as const

function disarmAll() {
  for (const type of GESTURES) window.removeEventListener(type, unlock, true)
}

/**
 * Starts decoding the pack, and listens for the first user gesture to create
 * the AudioContext inside it, the only moment every browser lets it start.
 * Returns the cleanup; arming is counted, so it stops listening once every
 * caller has cleaned up or the context is running.
 */
export function arm(pack: SoundPack): () => void {
  load(pack).catch(() => {})
  if (typeof window === 'undefined' || ctx?.state === 'running') return () => {}
  if (armed++ === 0) for (const type of GESTURES) window.addEventListener(type, unlock, { capture: true, passive: true })
  let live = true
  return () => {
    if (!live) return
    live = false
    if (--armed === 0) disarmAll()
  }
}
