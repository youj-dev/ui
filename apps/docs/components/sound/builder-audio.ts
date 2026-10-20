import { candidates } from '@youj/sound'
import { processSound, type ProcessedSound } from '@youj/sound/lab'
import { lab } from './builder-state'

/* The builder's own little player. It plays any candidate, or a file someone
 * brought, by id, one at a time (a comparison never overlaps), at the
 * builder's volume on the same squared curve as the player. Candidates
 * come from the package's own `candidates`, so what plays here is what ships;
 * they're decoded up front on an OfflineAudioContext, which needs no gesture.
 * The AudioContext itself is made inside the first press, as browsers
 * require. */

interface Clip {
  buffer: AudioBuffer
  /** Seconds of decoder lead-in to skip. */
  offset: number
}

const SAMPLE_RATE = 48_000
let ctx: AudioContext | undefined
let clips: Promise<Map<string, Clip>> | undefined
const own = new Map<string, Clip>()
let voice: { source: AudioBufferSourceNode; gain: GainNode } | undefined

/** MP3 decoders pad the front with silence: start at the first sample within 50 dB of the peak, less a millisecond. */
function onset(buffer: AudioBuffer) {
  const data = buffer.getChannelData(0)
  let peak = 0
  for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]!))
  let first = 0
  while (first < data.length && Math.abs(data[first]!) <= peak * 0.00316) first++
  return Math.max(0, first / buffer.sampleRate - 0.001)
}

const loaders = candidates as Record<string, Record<string, () => Promise<Uint8Array>>>

/** Fetches and decodes every candidate once. */
export function preloadClips(): Promise<Map<string, Clip>> {
  return (clips ??= (async () => {
    const decoder = new OfflineAudioContext(1, 1, SAMPLE_RATE)
    const map = new Map<string, Clip>()
    await Promise.all(
      lab.flatMap(({ cue, variants }) =>
        variants.map(async ({ id, family }) => {
          const bytes = await loaders[cue]![family]!()
          const buffer = await decoder.decodeAudioData(bytes.slice().buffer as ArrayBuffer)
          map.set(id, { buffer, offset: onset(buffer) })
        }),
      ),
    ).catch((error: unknown) => {
      clips = undefined
      throw error
    })
    return map
  })())
}

/**
 * Reads a file for a cue: decoded (and resampled to 48 kHz) by the browser,
 * then fitted to the pack (lab/process.ts). Registers it to play as `id`.
 * Throws with a message for the person who chose it.
 */
export async function readFile(id: string, file: File, target: { level: number; window: number }): Promise<ProcessedSound> {
  let decoded: AudioBuffer
  try {
    decoded = await new OfflineAudioContext(1, 1, SAMPLE_RATE).decodeAudioData(await file.arrayBuffer())
  } catch {
    throw new Error('This browser can’t read it. Try WAV or MP3.')
  }
  const sound = processSound(
    Array.from({ length: decoded.numberOfChannels }, (_, i) => decoded.getChannelData(i)),
    decoded.sampleRate,
    target,
  )
  const buffer = new AudioBuffer({ length: sound.samples.length, numberOfChannels: 1, sampleRate: SAMPLE_RATE })
  buffer.copyToChannel(sound.samples as Float32Array<ArrayBuffer>, 0)
  own.set(id, { buffer, offset: 0 })
  return sound
}

export const forgetFile = (id: string) => own.delete(id)

/** The page's context, made or resumed inside the gesture that asked for sound. */
function context(): AudioContext {
  ctx ??= new AudioContext({ latencyHint: 'interactive' })
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function stopClip() {
  voice?.source.stop()
  voice = undefined
}

/** Plays a candidate or a file, stopping any other. Resolves with how long it rings (ms), or undefined if it can't play. Call it from a gesture. */
export async function playClip(id: string, volume: number): Promise<number | undefined> {
  const audio = context()
  const clip = own.get(id) ?? (await preloadClips()).get(id)
  if (!clip) return undefined
  stopClip()
  const source = audio.createBufferSource()
  const gain = audio.createGain()
  source.buffer = clip.buffer
  gain.gain.value = Math.min(Math.max(volume, 0), 1) ** 2
  source.connect(gain).connect(audio.destination)
  const current = { source, gain }
  voice = current
  source.onended = () => {
    gain.disconnect()
    if (voice === current) voice = undefined
  }
  source.start(0, clip.offset)
  return (clip.buffer.duration - clip.offset) * 1000
}
