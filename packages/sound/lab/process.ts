/* What the Sound builder does to a file someone brings, so it sits in the
 * pack like one of its own: mixed to mono, DC removed, the silence before and
 * after it trimmed, levelled to the cue's loudness by the render's own meter
 * (and pulled down if its true peak would pass −1 dBTP), with a clean start
 * and a faded tail. Then it's measured for the builder's warnings and written
 * as 16-bit WAV, which every browser decodes. Plain arithmetic on samples at
 * 48 kHz: decoding (and resampling to 48 kHz) is the browser's job. */

import { SAMPLE_RATE, loudness, truePeak, waveform } from './meter'

/** The cue it's for: its loudness and the span the builder draws it over. */
export interface CueTarget {
  /** LUFS over the loudest 100 ms, what every candidate of the cue is set to. */
  level: number
  /** ms. */
  window: number
}

/** `long`: it rings past LONG_MS. `clipped`: the file hits full scale, so it's distorted. `quiet`: it can't reach the pack's loudness without clipping. */
export type SoundIssue = 'long' | 'clipped' | 'quiet'

export interface ProcessedSound {
  /** Mono at 48 kHz, ready to play and to write. */
  samples: Float32Array
  /** Until it stays 40 dB under its peak: what a listener hears. */
  ms: number
  /** What it took to match the pack, dB. */
  gain: number
  /** Silence trimmed from its front, ms. */
  trimmed: number
  /** Loudness after, LUFS over the loudest 100 ms. */
  lufs: number
  /** The file's channels, mixed to one. */
  channels: number
  issues: SoundIssue[]
  /** 48 bars over the cue's window, 0–100, as the candidates are drawn. */
  wave: number[]
}

/** Longer than this rings on after its moment. */
export const LONG_MS = 400
/** Longer than this after trimming isn't an interface sound at all. */
const MAX_MS = 5000
/** Where the sound starts, and where its tail has died, under its peak; as the player and the render find them. */
const START_DB = -50
const END_DB = -60
/** The true peak it may reach once levelled. */
const CEILING_DB = -1
/** A shortfall worth mentioning. */
const QUIET_DB = 1

const db = (d: number) => 10 ** (d / 20)
const toDb = (a: number) => 20 * Math.log10(Math.max(a, 1e-12))
const samples = (ms: number) => Math.round((ms / 1000) * SAMPLE_RATE)

/** A 2nd-order high-pass at 20 Hz: takes out DC without touching what's heard. */
function highpass(x: Float64Array): Float64Array {
  const w = (2 * Math.PI * 20) / SAMPLE_RATE
  const alpha = Math.sin(w) / (2 * Math.SQRT1_2)
  const a0 = 1 + alpha
  const [b0, b1, b2, a1, a2] = [(1 + Math.cos(w)) / 2 / a0, -(1 + Math.cos(w)) / a0, (1 + Math.cos(w)) / 2 / a0, (-2 * Math.cos(w)) / a0, (1 - alpha) / a0]
  const y = new Float64Array(x.length)
  let [x1, x2, y1, y2] = [0, 0, 0, 0]
  for (let i = 0; i < x.length; i++) {
    y[i] = b0 * x[i]! + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
    ;[x2, x1, y2, y1] = [x1, x[i]!, y1, y[i]!]
  }
  return y
}

const peakOf = (x: ArrayLike<number>) => {
  let top = 0
  for (let i = 0; i < x.length; i++) top = Math.max(top, Math.abs(x[i]!))
  return top
}

/** Full scale held for three samples running, or passed: a file that clipped when it was made. */
function clips(channel: Float32Array) {
  let run = 0
  for (const x of channel) {
    if (Math.abs(x) > 1) return true
    run = Math.abs(x) >= 0.999 ? run + 1 : 0
    if (run >= 3) return true
  }
  return false
}

/**
 * Makes a decoded file (its channels at 48 kHz) fit a cue. Throws, with a
 * message for the person who chose it, when there's nothing usable: a
 * silent file, or one far too long for an interface.
 */
export function processSound(channels: Float32Array[], sampleRate: number, target: CueTarget): ProcessedSound {
  if (sampleRate !== SAMPLE_RATE) throw new Error(`Decode it at ${SAMPLE_RATE} Hz first.`)
  const length = Math.max(0, ...channels.map((c) => c.length))
  const mono = new Float64Array(length)
  for (const channel of channels) for (let i = 0; i < channel.length; i++) mono[i]! += channel[i]! / channels.length
  if (peakOf(mono) < db(-80)) throw new Error('It’s silent.')

  const filtered = highpass(mono)
  const top = peakOf(filtered)
  let start = 0
  while (start < filtered.length && Math.abs(filtered[start]!) <= top * db(START_DB)) start++
  let end = filtered.length
  while (end > start && Math.abs(filtered[end - 1]!) <= top * db(END_DB)) end--
  // A millisecond of lead, as the player keeps, and two of tail past the last audible sample.
  start = Math.max(0, start - samples(1))
  end = Math.min(filtered.length, end + samples(2))
  const ms = ((end - start) / SAMPLE_RATE) * 1000
  if (ms > MAX_MS) throw new Error(`It’s ${(ms / 1000).toFixed(1)} s long: an interface sound lasts well under a second.`)

  // A clean start and a faded tail (raised cosines), so it can't click.
  const sound = filtered.slice(start, end)
  const fadeIn = Math.min(samples(0.4), sound.length)
  const fadeOut = Math.min(samples(8), Math.floor(sound.length / 4))
  for (let i = 0; i < fadeIn; i++) sound[i]! *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fadeIn)
  for (let i = 0; i < fadeOut; i++) sound[sound.length - 1 - i]! *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fadeOut)

  // Levelled like the render levels a candidate: to the cue's loudness, unless the true peak would pass the ceiling.
  const before = loudness(sound)
  const peak = toDb(truePeak(sound))
  const wanted = target.level - before
  const gain = Math.min(wanted, CEILING_DB - peak)
  const out = Float32Array.from(sound, (x) => x * db(gain))

  const outTop = peakOf(out)
  let audible = out.length
  while (audible > 0 && Math.abs(out[audible - 1]!) < outTop * db(-40)) audible--
  const heard = Math.round((audible / SAMPLE_RATE) * 1000)
  const issues: SoundIssue[] = []
  if (heard > LONG_MS) issues.push('long')
  if (channels.some(clips)) issues.push('clipped')
  if (wanted - gain > QUIET_DB) issues.push('quiet')

  return {
    samples: out,
    ms: heard,
    gain: Math.round(gain * 10) / 10,
    trimmed: Math.round((start / SAMPLE_RATE) * 1000),
    lufs: Math.round(loudness(out) * 10) / 10,
    channels: channels.length,
    issues,
    wave: waveform(out, 48, target.window / 1000).map((v) => Math.round(v * 100)),
  }
}

/** Mono 16-bit PCM WAV. */
export function encodeWav(sound: Float32Array, sampleRate = SAMPLE_RATE): Uint8Array {
  const bytes = sound.length * 2
  const view = new DataView(new ArrayBuffer(44 + bytes))
  const text = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)))
  text(0, 'RIFF')
  view.setUint32(4, 36 + bytes, true)
  text(8, 'WAVE')
  text(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  text(36, 'data')
  view.setUint32(40, bytes, true)
  sound.forEach((x, i) => view.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, x)) * 32767), true))
  return new Uint8Array(view.buffer)
}
