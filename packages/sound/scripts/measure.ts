/* Measuring what can't be heard here. Every rendered sound gets:
 *
 * - loudness: ITU-R BS.1770 K-weighting, as momentary loudness (the loudest
 *   400 ms, LUFS-M) and over the loudest 100 ms, which suits sounds this
 *   short (the ear integrates loudness over roughly 100–200 ms);
 * - peak and true peak (4× oversampled), so nothing clips after encoding;
 * - spectrum: centroid, the share of energy in the ear's most sensitive and
 *   most tiring band (2–5 kHz), the share below 250 Hz (lost on laptop and
 *   phone speakers), and bands for drawing;
 * - timing: time to peak, the attack, and how long it stays within 40 and
 *   60 dB of its peak;
 * - clicks: the level of the first and last samples, the steepest step in
 *   the first millisecond, and DC.
 *
 * The loudness, true peak and waveform come from lab/meter.ts, which the
 * Sound builder uses to match a file someone brings to the same levels. */

import { kWeight, maxLoudness, truePeak } from '../lab/meter.ts'
import { fft, lowpass, SR, toDb, type Signal } from './dsp.ts'

export { waveform } from '../lab/meter.ts'

export interface Metrics {
  /** Length of the file, ms. */
  ms: number
  /** Until the level stays 40 dB under the peak: what a listener hears. */
  audibleMs: number
  peakDb: number
  truePeakDb: number
  /** Momentary loudness, max over 400 ms windows. */
  lufsM: number
  /** Max over 100 ms windows (K-weighted, same scale). */
  lufs100: number
  centroidHz: number
  /** % of energy in 2–5 kHz. */
  harsh: number
  /** % of energy under 250 Hz. */
  low: number
  /** ms from the start to the peak. */
  peakAtMs: number
  /** ms for the envelope to rise from 10% to 90% of its peak. */
  attackMs: number
  /** Mean absolute speed of the dominant tonal ridge (including pitch
   * steps), Hz/s. Null when too few periodic frames exist, as with air.
   * This is a measured audible ridge, not a claimed fundamental of FM. */
  pitchMovementHzPerSecond: number | null
  /** Signed first-to-last tonal ridge change per second; sweeps retain direction. */
  pitchDriftHzPerSecond: number | null
  /** Fraction of active analysis frames that have a reliable tonal ridge. */
  pitchedPercent: number
  /** Signed first-to-last short-time spectral centroid movement, Hz/s.
   * Useful for unpitched noise sweeps; it is not labelled pitch. */
  spectralMovementHzPerSecond: number
  /** First and last sample, dB under the peak. */
  startDb: number
  endDb: number
  /** Steepest sample-to-sample step in the first ms, as a fraction of the peak. */
  startStep: number
  /** Mean, as a fraction of the peak. */
  dc: number
}

/** 12 ms Hann frames every 3 ms (6 / 1.5 ms for files shorter than 32 ms),
 * zero-padded for peak interpolation.
 * Periodicity (normalised autocorrelation of a lowpassed, 12 kHz signal)
 * rejects noise. The ridge is the strongest 250–3600 Hz spectral peak.
 * Ignore frames >30 dB below the loudest frame and bridge no more than
 * 12 ms of missing pitch. A 12 Hz hysteresis rejects estimator jitter but
 * accumulates slow movement. Steps and glides share the same units. */
export function movement(sig: Signal) {
  const short = sig.length < SR * 0.032
  const width = Math.min(Math.round(SR * (short ? 0.006 : 0.012)), sig.length)
  const hop = Math.round(SR * (short ? 0.0015 : 0.003))
  const n = 4096
  const filtered = lowpass(sig, 3800, 0.6)
  const frames: { t: number; energy: number; centroid: number; pitch: number | null }[] = []
  for (let start = 0; start + width <= sig.length; start += hop) {
    const re = new Float64Array(n)
    const im = new Float64Array(n)
    let energy = 0
    const down = new Float64Array(Math.floor(width / 4))
    for (let i = 0; i < width; i++) {
      const x = sig[start + i]!
      re[i] = x * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (width - 1)))
      energy += x * x
      if (i % 4 === 0) down[i / 4] = filtered[start + i]!
    }
    // Enough cycles to identify a tone, without inventing pitches for noise.
    let periodicity = 0
    for (let lag = 4; lag <= Math.min(48, down.length / 2); lag++) {
      let dot = 0, a = 0, b = 0
      for (let j = 0; j < down.length - lag; j++) {
        dot += down[j]! * down[j + lag]!
        a += down[j]! ** 2
        b += down[j + lag]! ** 2
      }
      periodicity = Math.max(periodicity, dot / Math.sqrt(a * b || 1))
    }
    fft(re, im)
    const power = re.map((x, i) => x * x + im[i]! ** 2)
    let total = 0, moment = 0, peak = 0
    for (let k = 2; k < n / 2; k++) {
      const f = k * SR / n
      total += power[k]!
      moment += power[k]! * f
      if (f >= 250 && f <= 3600 && power[k]! > power[peak]!) peak = k
    }
    let pitch: number | null = null
    if (periodicity >= 0.7 && peak > 0) {
      const left = Math.log(power[peak - 1]! + 1e-30)
      const mid = Math.log(power[peak]! + 1e-30)
      const right = Math.log(power[peak + 1]! + 1e-30)
      const offset = Math.max(-0.5, Math.min(0.5, 0.5 * (left - right) / (left - 2 * mid + right)))
      pitch = (peak + offset) * SR / n
    }
    frames.push({ t: (start + width / 2) / SR, energy, centroid: moment / (total || 1), pitch })
  }
  const top = Math.max(0, ...frames.map((f) => f.energy))
  const active = frames.filter((f) => f.energy > top * 0.001)
  const pitched = active.filter((f): f is typeof f & { pitch: number } => f.pitch !== null)
  let travel = 0, seconds = 0
  let anchor = pitched[0]?.pitch ?? 0
  for (let i = 1; i < pitched.length; i++) {
    const prev = pitched[i - 1]!, next = pitched[i]!
    const gap = next.t - prev.t
    if (gap > 0.0121) { anchor = next.pitch; continue }
    const change = Math.abs(next.pitch - anchor)
    if (change > 12) { travel += change; anchor = next.pitch }
    seconds += gap
  }
  const first = pitched[0], last = pitched.at(-1)
  const reliable = pitched.length >= 3 && pitched.length >= active.length * 0.35 && seconds > 0
  const head = active[0], tail = active.at(-1)
  return {
    pitchMovementHzPerSecond: reliable ? travel / seconds : null,
    pitchDriftHzPerSecond: reliable && first && last ? (last.pitch - first.pitch) / (last.t - first.t) : null,
    pitchedPercent: 100 * pitched.length / (active.length || 1),
    spectralMovementHzPerSecond: head && tail && tail.t > head.t ? (tail.centroid - head.centroid) / (tail.t - head.t) : 0,
  }
}

/** The sound's energy spectrum: bin power over frequency. */
export function powerSpectrum(sig: Signal): { power: Float64Array; binHz: number } {
  let n = 8192
  while (n < sig.length) n <<= 1
  const re = new Float64Array(n)
  const im = new Float64Array(n)
  re.set(sig)
  fft(re, im)
  const power = new Float64Array(n / 2)
  for (let i = 0; i < n / 2; i++) power[i] = re[i]! * re[i]! + im[i]! * im[i]!
  return { power, binHz: SR / n }
}

/** Energy in log-spaced bands from `lo` to `hi` Hz, in dB under the loudest band (0 = loudest). */
export function spectrumBands(sig: Signal, count = 28, lo = 100, hi = 16000): number[] {
  const { power, binHz } = powerSpectrum(sig)
  const edges = Array.from({ length: count + 1 }, (_, i) => lo * (hi / lo) ** (i / count))
  const bands = edges.slice(0, -1).map((from, i) => {
    const a = Math.max(1, Math.floor(from / binHz))
    const b = Math.max(a + 1, Math.ceil(edges[i + 1]! / binHz))
    let sum = 0
    for (let k = a; k < b && k < power.length; k++) sum += power[k]!
    // Per Hz, so wide bands don't read louder for being wide.
    return sum / ((b - a) * binHz)
  })
  const top = Math.max(...bands)
  return bands.map((e) => 10 * Math.log10(Math.max(e / top, 1e-12)))
}

export function measure(sig: Signal): Metrics {
  let top = 0
  let topAt = 0
  let sum = 0
  for (let i = 0; i < sig.length; i++) {
    const a = Math.abs(sig[i]!)
    sum += sig[i]!
    if (a > top) (top = a), (topAt = i)
  }
  const weighted = kWeight(sig)
  const { power, binHz } = powerSpectrum(sig)
  let total = 0
  let harsh = 0
  let low = 0
  let moment = 0
  for (let k = 1; k < power.length; k++) {
    const f = k * binHz
    if (f < 20 || f > 20000) continue
    total += power[k]!
    moment += f * power[k]!
    if (f >= 2000 && f <= 5000) harsh += power[k]!
    if (f < 250) low += power[k]!
  }
  // A smoothed envelope (1 ms) for the attack.
  const env = new Float64Array(sig.length)
  const k = Math.exp(-1 / (0.001 * SR))
  let e = 0
  for (let i = 0; i < sig.length; i++) env[i] = e = Math.max(Math.abs(sig[i]!), e * k)
  const envTop = Math.max(...env)
  const first = (level: number) => env.findIndex((v) => v >= envTop * level)
  const lastAbove = (dbUnder: number) => {
    const threshold = top * 10 ** (dbUnder / 20)
    for (let i = sig.length - 1; i >= 0; i--) if (Math.abs(sig[i]!) >= threshold) return i
    return 0
  }
  let startStep = 0
  for (let i = 1; i < Math.min(sig.length, SR / 1000); i++) startStep = Math.max(startStep, Math.abs(sig[i]! - sig[i - 1]!))
  const ms = (n: number) => (n / SR) * 1000
  return {
    ms: ms(sig.length),
    audibleMs: ms(lastAbove(-40)),
    peakDb: toDb(top),
    truePeakDb: toDb(truePeak(sig)),
    lufsM: maxLoudness(weighted, 0.4),
    lufs100: maxLoudness(weighted, 0.1),
    centroidHz: moment / (total || 1),
    harsh: (100 * harsh) / (total || 1),
    low: (100 * low) / (total || 1),
    peakAtMs: ms(topAt),
    attackMs: ms(first(0.9) - first(0.1)),
    ...movement(sig),
    startDb: toDb(Math.abs(sig[0] ?? 0) / (top || 1)),
    endDb: toDb(Math.abs(sig.at(-1) ?? 0) / (top || 1)),
    startStep: startStep / (top || 1),
    dc: Math.abs(sum / sig.length) / (top || 1),
  }
}
