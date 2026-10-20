/* The bench the sounds are made on: small, deterministic DSP in plain
 * TypeScript, so a render is the same on every machine and needs nothing but
 * Node. Signals are Float64Array at 48 kHz, mono. Every random choice comes
 * from a seeded generator; nothing is sampled from anywhere.
 *
 * - Sources: sines with pitch curves, FM pairs, square/pulse waves, filtered
 *   noise, a mallet's contact pulse.
 * - Bodies: modal resonator banks (struck glass, wood, plastic) and a
 *   Karplus–Strong string (plucks).
 * - Color/space: bitcrush, sample-and-hold, mono chorus and a short synthetic
 *   room, convolved (FFT), mixed well below the dry.
 * - Finish: DC blocking, gentle saturation, a clean start and a faded tail. */

export const SR = 48_000
export type Signal = Float64Array

export const samples = (s: number) => Math.max(0, Math.round(s * SR))
export const db = (d: number) => 10 ** (d / 20)
export const toDb = (a: number) => 20 * Math.log10(Math.max(Math.abs(a), 1e-12))
export const semitones = (s: number) => 2 ** (s / 12)
export const cents = (c: number) => 2 ** (c / 1200)
/** Seconds for an exponential decay to fall 60 dB → its per-sample multiplier. */
const perSample = (t60: number) => Math.exp(-6.907755 / (Math.max(t60, 1e-4) * SR))

/** E minor pentatonic, the palette's shared notes, so any two sounds that overlap agree. */
export const NOTE = {
  E4: 329.63,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  D5: 587.33,
  E5: 659.26,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,
  D6: 1174.66,
  E6: 1318.51,
  G6: 1567.98,
  A6: 1760.0,
} as const

export const silence = (duration: number): Signal => new Float64Array(samples(duration))

/** Sums parts into one signal as long as the longest, each placed at `at` seconds and scaled by `gain` (linear). */
export function mix(...parts: { sig: Signal; at?: number; gain?: number }[]): Signal {
  const length = Math.max(0, ...parts.map((p) => samples(p.at ?? 0) + p.sig.length))
  const out = new Float64Array(length)
  for (const { sig, at = 0, gain = 1 } of parts) {
    const offset = samples(at)
    for (let i = 0; i < sig.length; i++) out[offset + i]! += sig[i]! * gain
  }
  return out
}

export const scale = (sig: Signal, gain: number): Signal => sig.map((x) => x * gain)

export function peak(sig: Signal): number {
  let p = 0
  for (const x of sig) p = Math.max(p, Math.abs(x))
  return p
}

/* ---------------------------------------------------------------- random */

/** mulberry32: a tiny seeded generator, uniform in [0, 1). */
export function random(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** White, pink (equal energy per octave: breath, not hiss) or brown noise, from a seed. */
export function noise(duration: number, seed: number, color: 'white' | 'pink' | 'brown' = 'white'): Signal {
  const next = random(seed)
  const out = silence(duration)
  const b = [0, 0, 0, 0, 0, 0, 0]
  let brown = 0
  for (let i = 0; i < out.length; i++) {
    const white = next() * 2 - 1
    if (color === 'white') out[i] = white
    else if (color === 'brown') {
      brown = (brown + 0.02 * white) / 1.02
      out[i] = brown * 3.5
    } else {
      // Paul Kellet's pinking filter.
      b[0] = 0.99886 * b[0]! + white * 0.0555179
      b[1] = 0.99332 * b[1]! + white * 0.0750759
      b[2] = 0.969 * b[2]! + white * 0.153852
      b[3] = 0.8665 * b[3]! + white * 0.3104856
      b[4] = 0.55 * b[4]! + white * 0.5329522
      b[5] = -0.7616 * b[5]! - white * 0.016898
      out[i] = (b[0]! + b[1]! + b[2]! + b[3]! + b[4]! + b[5]! + b[6]! + white * 0.5362) * 0.11
      b[6] = white * 0.115926
    }
  }
  return out
}

/* ------------------------------------------------------------- envelopes */

/** A raised-cosine ramp 0 → 1 over `n` samples, evaluated at `i`. */
const rise = (i: number, n: number) => (n <= 0 ? 1 : i >= n ? 1 : 0.5 - 0.5 * Math.cos((Math.PI * i) / n))

export interface Envelope {
  /** Seconds to full level, on a raised cosine (no corner, so no click). */
  attack: number
  /** Seconds held at full level. Default 0. */
  hold?: number
  /** Seconds for the exponential decay to fall 60 dB. */
  decay: number
}

/** Shapes a signal: a smooth attack, an optional hold, then an exponential decay. */
export function envelope(sig: Signal, { attack, hold = 0, decay }: Envelope): Signal {
  const a = samples(attack)
  const h = samples(hold)
  const k = perSample(decay)
  let level = 1
  return sig.map((x, i) => {
    if (i < a) return x * rise(i, a)
    if (i < a + h) return x
    level *= k
    return x * level
  })
}

/** A swell: rises on a raised cosine for `attack`, then falls for `release` on a raised cosine. For breath and air. */
export function swell(sig: Signal, attack: number, release: number): Signal {
  const a = samples(attack)
  const r = samples(release)
  return sig.map((x, i) => (i < a ? x * rise(i, a) : i < a + r ? x * (1 - rise(i - a, r)) : 0))
}

/* ------------------------------------------------------------- sources */

type Curve = number | ((t: number) => number)
const at = (curve: Curve, t: number) => (typeof curve === 'number' ? curve : curve(t))

/** An exponential glide from `from` to `to` Hz over `time` seconds, then steady. */
export const glide = (from: number, to: number, time: number) => (t: number) => (t >= time ? to : from * (to / from) ** (t / time))

/** A sine whose pitch follows `freq` (Hz, or a curve over seconds). */
export function sine(duration: number, freq: Curve, phase = 0): Signal {
  const out = silence(duration)
  let p = phase
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.sin(p)
    p += (2 * Math.PI * at(freq, i / SR)) / SR
  }
  return out
}

/** Band-limited saw with a continuous pitch curve. Harmonics stop below
 * 12 kHz using the highest frequency the curve reaches in this signal. */
export function saw(duration: number, freq: Curve): Signal {
  const out = silence(duration)
  let highest = 1
  for (let i = 0; i < out.length; i++) highest = Math.max(highest, at(freq, i / SR))
  const harmonics = Math.floor(12_000 / highest)
  let phase = 0
  for (let i = 0; i < out.length; i++) {
    let value = 0
    for (let h = 1; h <= harmonics; h++) value += Math.sin(h * phase) / h
    out[i] = value * 2 / Math.PI
    phase += 2 * Math.PI * at(freq, i / SR) / SR
  }
  return out
}

/** Band-limited pulse wave. At 50% duty this is a square; narrower pulses
 * retain even harmonics. Additive synthesis avoids aliasing at the source. */
export function pulse(duration: number, freq: number, duty = 0.5): Signal {
  const out = silence(duration)
  const harmonics = Math.floor(Math.min(12_000, SR * 0.45) / freq)
  for (let h = 1; h <= harmonics; h++) {
    const gain = (2 * Math.sin(Math.PI * h * duty)) / (Math.PI * h)
    for (let i = 0; i < out.length; i++) out[i]! += gain * Math.cos((2 * Math.PI * h * freq * i) / SR - Math.PI * h * duty)
  }
  return out
}

/** A hint of quantisation and sample-and-hold, mixed into the clean source. */
export function lofi(sig: Signal, { bits = 8, rate = 16_000, wet = 0.12 } = {}): Signal {
  const steps = 2 ** (bits - 1)
  const hop = Math.max(1, Math.round(SR / rate))
  let held = 0
  return sig.map((x, i) => {
    if (i % hop === 0) held = Math.round(x * steps) / steps
    return x * (1 - wet) + held * wet
  })
}

/** One gently moving delay mixed in mono: chorus without stereo or a room. */
export function chorus(sig: Signal, { delay = 0.003, depth = 0.00035, rate = 6, wet = 0.12 } = {}): Signal {
  return sig.map((x, i) => {
    const read = i - SR * (delay + depth * Math.sin((2 * Math.PI * rate * i) / SR))
    const j = Math.floor(read)
    const fraction = read - j
    const delayed = j >= 0 && j + 1 < sig.length ? sig[j]! * (1 - fraction) + sig[j + 1]! * fraction : 0
    return x + wet * delayed
  })
}

export interface Partial {
  /** Frequency ratio to the fundamental. */
  ratio: number
  /** Linear level. */
  gain: number
  /** T60 of this partial, seconds. Higher partials usually die sooner. */
  decay: number
  /** Detune in cents, for a slow beat against its neighbour. */
  detune?: number
}

/** Additive tone: each partial a sine with its own decay, over a shared attack. */
export function partials(duration: number, f0: Curve, list: Partial[], attack = 0.001): Signal {
  const out = silence(duration)
  const a = samples(attack)
  for (const { ratio, gain, decay, detune = 0 } of list) {
    const k = perSample(decay)
    const mult = ratio * cents(detune)
    let p = 0
    let level = gain
    for (let i = 0; i < out.length; i++) {
      out[i]! += Math.sin(p) * level * rise(i, a)
      p += (2 * Math.PI * at(f0, i / SR) * mult) / SR
      if (i >= a) level *= k
    }
  }
  return out
}

export interface FM {
  /** Carrier frequency (Hz or a curve). */
  carrier: Curve
  /** Modulator frequency as a ratio of the carrier. */
  ratio: number
  /** Modulation index at the start; it decays with `indexDecay`, so the tone starts bright and mellows. */
  index: number
  /** T60 of the index, seconds. */
  indexDecay: number
}

/** Two-operator FM: a sine carrier phase-modulated by a sine, its brightness decaying. */
export function fm(duration: number, { carrier, ratio, index, indexDecay }: FM): Signal {
  const out = silence(duration)
  const k = perSample(indexDecay)
  let pc = 0
  let pm = 0
  let I = index
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.sin(pc + I * Math.sin(pm))
    const f = at(carrier, i / SR)
    pc += (2 * Math.PI * f) / SR
    pm += (2 * Math.PI * f * ratio) / SR
    I *= k
  }
  return out
}

/**
 * A mallet's contact force: a half-sine pulse `width` seconds long, of unit
 * area. A narrow pulse (a hard mallet, a fingernail) excites every mode; a
 * wide one (felt, a fingertip) rolls off everything above about 1/width.
 */
export function mallet(width: number): Signal {
  const n = Math.max(1, samples(width))
  const out = new Float64Array(n)
  let sum = 0
  for (let i = 0; i < n; i++) sum += out[i] = Math.sin((Math.PI * (i + 0.5)) / n)
  return out.map((x) => x / sum)
}

/* --------------------------------------------------------------- bodies */

export interface Mode {
  /** Hz. */
  freq: number
  /** T60, seconds. */
  decay: number
  /** Linear level for a unit-area strike. */
  gain: number
}

/**
 * A struck body: each mode a two-pole resonator ringing at its frequency and
 * dying away over its T60, all driven by the same excitation (usually a
 * mallet pulse, maybe with some contact noise). This is what makes glass
 * sound like glass: the modes' ratios, not a waveform.
 */
export function resonate(excitation: Signal, modes: Mode[], duration: number): Signal {
  const out = silence(duration)
  for (const { freq, decay, gain } of modes) {
    if (freq >= SR / 2 - 100) continue
    const theta = (2 * Math.PI * freq) / SR
    const r = perSample(decay)
    const c1 = 2 * r * Math.cos(theta)
    const c2 = -r * r
    // Zeros at DC and Nyquist (1 − z⁻²): the impulse response is 2rⁿcos(nθ), what a listener hears of a
    // struck body (its motion's derivative), with no slow bump of net displacement under it.
    const norm = gain * 0.5
    let x1 = 0
    let x2 = 0
    let y1 = 0
    let y2 = 0
    for (let i = 0; i < out.length; i++) {
      const x = i < excitation.length ? excitation[i]! : 0
      const y = x - x2 + c1 * y1 + c2 * y2
      out[i]! += norm * y
      x2 = x1
      x1 = x
      y2 = y1
      y1 = y
    }
  }
  return out
}

/** Mode tables of real bodies, as ratios to the fundamental. */
export const BODY = {
  /** A free–free bar: glass rods, chimes, the ring of a small glass. */
  bar: [1, 2.756, 5.404, 8.933],
  /** A marimba bar, its second mode tuned two octaves up; the third isn't tuned. */
  marimba: [1, 3.99, 9.2],
  /** A hollow woodblock: a close, inharmonic cluster. */
  block: [1, 1.52, 2.26, 3.47],
  /** A stiff plastic key or latch: few modes, heavily damped. */
  plastic: [1, 1.73, 2.61],
  /** A circular plate (a small bell or cymbal-ish ping). */
  plate: [1, 1.59, 2.14, 2.3, 2.65],
} as const

export interface Strike {
  f0: number
  /** Mode ratios (see BODY). */
  body: readonly number[]
  /** T60 of the fundamental; higher modes decay faster by `damping`. */
  decay: number
  /** How much faster each mode dies than the one below: T60 ∝ ratio^-damping. Glass ~0.5, wood ~1.5. */
  damping: number
  /** How quickly the upper modes lose level: gain ∝ ratio^-tilt. */
  tilt: number
  /** Contact time of the mallet, seconds. */
  mallet: number
  /** Level of contact noise (the texture of the surface), 0 for none. */
  grit?: number
  /** Band of the contact noise. */
  gritBand?: [number, number]
  seed?: number
  duration: number
}

/** A struck object: a mallet pulse into a modal body, plus the short scrape of contact (`grit`, relative to the body). */
export function strike({ f0, body, decay, damping, tilt, mallet: width, grit = 0, gritBand = [1500, 6000], seed = 1, duration }: Strike): Signal {
  const modes = body.map((ratio) => ({ freq: f0 * ratio, decay: decay * ratio ** -damping, gain: ratio ** -tilt }))
  const ring = resonate(mallet(width), modes, duration)
  if (grit <= 0) return ring
  return mix({ sig: ring }, { sig: contact(width, gritBand, seed), gain: grit * peak(ring) })
}

/** The noise of a contact: a few milliseconds of seeded noise between `lo` and `hi` Hz (24 dB/octave edges), peak 1. */
export function contact(width: number, [lo, hi]: readonly [number, number], seed: number): Signal {
  const burst = envelope(noise(0.004 + width * 3, seed), { attack: 0.0002, decay: 0.003 + width * 4 })
  const shaped = band(burst, lo, hi)
  return scale(shaped, 1 / Math.max(peak(shaped), 1e-9))
}

/** Keeps `lo`–`hi` Hz with 24 dB/octave edges: two high-passes, two low-passes. */
export const band = (sig: Signal, lo: number, hi: number) => lowpass(lowpass(highpass(highpass(sig, lo), lo), hi), hi)

/**
 * A plucked string (Karplus–Strong, with Jaffe–Smith's refinements): a burst
 * of seeded noise circulating in a delay line one period long, softened a
 * little on every pass, so the highs die first, like a real string.
 */
export function pluck({
  freq,
  decay,
  brightness = 0.6,
  pick = 0.2,
  duration,
  seed = 7,
}: {
  freq: number
  /** T60 of the fundamental, seconds. */
  decay: number
  /** 0 dark (a thumb) … 1 bright (a plectrum). */
  brightness?: number
  /** Where the string is plucked, as a fraction of its length: near the end is thin, near the middle is round. */
  pick?: number
  duration: number
  seed?: number
}): Signal {
  const period = SR / freq
  const S = 0.5
  // The loop's delay: an integer line, the averaging filter's half sample and an allpass for the fraction.
  const total = period - S
  let L = Math.floor(total - 0.1)
  let d = total - L
  if (d < 0.1) {
    L -= 1
    d += 1
  }
  const c = (1 - d) / (1 + d)
  const perPeriod = 10 ** (-3 / (decay * freq))
  const rho = Math.min(0.99995, perPeriod / Math.cos((Math.PI * freq) / SR))
  // Excitation: one period of noise, lowpassed by brightness, combed by the pick position.
  const next = random(seed)
  const burst = new Float64Array(L + 1).map(() => next() * 2 - 1)
  const a = 1 - brightness * 0.95
  let lp = 0
  for (let i = 0; i < burst.length; i++) burst[i] = lp = lp + (1 - a) * (burst[i]! - lp)
  const p = Math.max(1, Math.round(pick * burst.length))
  const excite = burst.map((x, i) => x - (i >= p ? burst[i - p]! : 0))
  const out = silence(duration)
  const line = new Float64Array(L + 2)
  let w = 0
  let prev = 0
  let apX = 0
  let apY = 0
  for (let i = 0; i < out.length; i++) {
    const delayed = line[w]!
    // Loop filter: rho * (averaging of this and the previous delayed sample).
    const filtered = rho * ((1 - S) * delayed + S * prev)
    prev = delayed
    // Fractional delay: first-order allpass.
    const ap = c * filtered + apX - c * apY
    apX = filtered
    apY = ap
    const y = (i < excite.length ? excite[i]! : 0) + ap
    line[w] = y
    w = (w + 1) % (L + 1)
    out[i] = y
  }
  return out
}

/* -------------------------------------------------------------- filters */

type BiquadKind = 'lowpass' | 'highpass' | 'bandpass' | 'peak' | 'lowshelf' | 'highshelf'

/** RBJ cookbook biquad, applied to the whole signal. Q is linear. `gain` (dB) is for peak and shelves. */
export function biquad(sig: Signal, kind: BiquadKind, freq: number, q = Math.SQRT1_2, gain = 0): Signal {
  const A = 10 ** (gain / 40)
  const w = (2 * Math.PI * Math.min(freq, SR / 2 - 10)) / SR
  const cw = Math.cos(w)
  const alpha = Math.sin(w) / (2 * q)
  let b0 = 0
  let b1 = 0
  let b2 = 0
  let a0 = 1
  let a1 = 0
  let a2 = 0
  switch (kind) {
    case 'lowpass':
      ;[b0, b1, b2, a0, a1, a2] = [(1 - cw) / 2, 1 - cw, (1 - cw) / 2, 1 + alpha, -2 * cw, 1 - alpha]
      break
    case 'highpass':
      ;[b0, b1, b2, a0, a1, a2] = [(1 + cw) / 2, -(1 + cw), (1 + cw) / 2, 1 + alpha, -2 * cw, 1 - alpha]
      break
    case 'bandpass':
      ;[b0, b1, b2, a0, a1, a2] = [alpha, 0, -alpha, 1 + alpha, -2 * cw, 1 - alpha]
      break
    case 'peak':
      ;[b0, b1, b2, a0, a1, a2] = [1 + alpha * A, -2 * cw, 1 - alpha * A, 1 + alpha / A, -2 * cw, 1 - alpha / A]
      break
    case 'lowshelf': {
      const s = 2 * Math.sqrt(A) * alpha
      ;[b0, b1, b2, a0, a1, a2] = [A * (A + 1 - (A - 1) * cw + s), 2 * A * (A - 1 - (A + 1) * cw), A * (A + 1 - (A - 1) * cw - s), A + 1 + (A - 1) * cw + s, -2 * (A - 1 + (A + 1) * cw), A + 1 + (A - 1) * cw - s]
      break
    }
    case 'highshelf': {
      const s = 2 * Math.sqrt(A) * alpha
      ;[b0, b1, b2, a0, a1, a2] = [A * (A + 1 + (A - 1) * cw + s), -2 * A * (A - 1 + (A + 1) * cw), A * (A + 1 + (A - 1) * cw - s), A + 1 - (A - 1) * cw + s, 2 * (A - 1 - (A + 1) * cw), A + 1 - (A - 1) * cw - s]
      break
    }
  }
  return filter(sig, [b0 / a0, b1 / a0, b2 / a0], [a1 / a0, a2 / a0])
}

/** A direct-form I biquad with normalised coefficients. */
export function filter(sig: Signal, [b0, b1, b2]: number[], [a1, a2]: number[]): Signal {
  let x1 = 0
  let x2 = 0
  let y1 = 0
  let y2 = 0
  return sig.map((x) => {
    const y = b0! * x + b1! * x1 + b2! * x2 - a1! * y1 - a2! * y2
    x2 = x1
    x1 = x
    y2 = y1
    y1 = y
    return y
  })
}

export const lowpass = (sig: Signal, freq: number, q?: number) => biquad(sig, 'lowpass', freq, q)
export const highpass = (sig: Signal, freq: number, q?: number) => biquad(sig, 'highpass', freq, q)
/** Band-pass at `freq` with a peak gain of 1. */
export const bandpass = (sig: Signal, freq: number, q = 1) => biquad(sig, 'bandpass', freq, q)
export const tilt = (sig: Signal, freq: number, gain: number) => biquad(sig, gain < 0 ? 'highshelf' : 'lowshelf', freq, Math.SQRT1_2, gain < 0 ? gain : -gain)

/**
 * A state-variable filter (Simper's trapezoidal form) whose cutoff follows a
 * curve, stable however fast it moves: for sweeps and breath.
 */
export function sweep(sig: Signal, kind: 'lowpass' | 'bandpass' | 'highpass', cutoff: Curve, q = Math.SQRT1_2): Signal {
  const k = 1 / q
  let ic1 = 0
  let ic2 = 0
  return sig.map((v0, i) => {
    const g = Math.tan((Math.PI * Math.min(at(cutoff, i / SR), SR * 0.45)) / SR)
    const a1 = 1 / (1 + g * (g + k))
    const a2 = g * a1
    const a3 = g * a2
    const v3 = v0 - ic2
    const v1 = a1 * ic1 + a2 * v3
    const v2 = ic2 + a2 * ic1 + a3 * v3
    ic1 = 2 * v1 - ic1
    ic2 = 2 * v2 - ic2
    return kind === 'lowpass' ? v2 : kind === 'bandpass' ? v1 * k : v0 - k * v1 - v2
  })
}

/* ---------------------------------------------------------------- color */

/** Soft saturation: unity for small signals, rounding the loud ones; `bias` adds even harmonics (warmth). */
export function saturate(sig: Signal, drive: number, bias = 0): Signal {
  const offset = Math.tanh(drive * bias)
  return sig.map((x) => (Math.tanh(drive * (x + bias)) - offset) / drive)
}

/* ---------------------------------------------------------------- space */

/** An in-place iterative radix-2 FFT (inverse when `inverse`). Lengths must be powers of two. */
export function fft(re: Float64Array, im: Float64Array, inverse = false) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j]!, re[i]!]
      ;[im[i], im[j]] = [im[j]!, im[i]!]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const angle = ((inverse ? 2 : -2) * Math.PI) / len
    const wr = Math.cos(angle)
    const wi = Math.sin(angle)
    for (let i = 0; i < n; i += len) {
      let cr = 1
      let ci = 0
      for (let k = 0; k < len / 2; k++) {
        const a = i + k
        const b = a + len / 2
        const tr = re[b]! * cr - im[b]! * ci
        const ti = re[b]! * ci + im[b]! * cr
        re[b] = re[a]! - tr
        im[b] = im[a]! - ti
        re[a]! += tr
        im[a]! += ti
        ;[cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr]
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) (re[i]! /= n), (im[i]! /= n)
}

export function convolve(a: Signal, b: Signal): Signal {
  const length = a.length + b.length - 1
  let n = 1
  while (n < length) n <<= 1
  const ar = new Float64Array(n)
  const ai = new Float64Array(n)
  const br = new Float64Array(n)
  const bi = new Float64Array(n)
  ar.set(a)
  br.set(b)
  fft(ar, ai)
  fft(br, bi)
  for (let i = 0; i < n; i++) {
    const r = ar[i]! * br[i]! - ai[i]! * bi[i]!
    ai[i] = ar[i]! * bi[i]! + ai[i]! * br[i]!
    ar[i] = r
  }
  fft(ar, ai, true)
  return ar.slice(0, length)
}

export interface Room {
  /** T60 of the tail's middle band, seconds: 0.12 is a small booth, 0.4 a quiet room. */
  decay: number
  /** How much faster the highs die (0.3 = soft furnishings, 0.8 = hard walls). */
  damping: number
  /** Wet level relative to the dry, dB. UI sounds want very little: −18 to −28. */
  wet: number
  /** Seconds before the first reflection. */
  predelay?: number
  seed?: number
}

/** A small synthetic room: a few early reflections, then seeded noise dying in three bands, each at its own rate. */
export function roomImpulse({ decay, damping, predelay = 0.004, seed = 11 }: Omit<Room, 'wet'>): Signal {
  const length = decay * 1.2 + predelay + 0.02
  const tail = noise(length, seed)
  const bands = [
    { sig: lowpass(tail, 700), t60: decay * 1.15 },
    { sig: bandpass(tail, 2000, 0.6), t60: decay },
    { sig: highpass(tail, 4000), t60: decay * damping },
  ].map(({ sig, t60 }) => envelope(sig, { attack: 0.003, decay: t60 }))
  const diffuse = mix(...bands.map((b) => ({ sig: b, at: predelay + 0.006 })))
  const early = silence(length)
  const next = random(seed + 1)
  for (const [time, gain] of [
    [0, 0.9],
    [0.0031, 0.55],
    [0.0057, -0.45],
    [0.0089, 0.35],
    [0.0123, -0.28],
    [0.0171, 0.2],
  ] as const) {
    const i = samples(predelay + time + next() * 0.0004)
    if (i < early.length) early[i] = gain
  }
  const ir = mix({ sig: lowpass(early, 6000) }, { sig: diffuse, gain: 0.5 })
  const energy = Math.sqrt(ir.reduce((sum, x) => sum + x * x, 0))
  return ir.map((x) => x / energy)
}

/** Puts a dry sound in a small room: the dry, plus the room's tail `wet` dB below it. */
export function room(sig: Signal, options: Room): Signal {
  const wet = convolve(sig, roomImpulse(options))
  return mix({ sig }, { sig: wet, gain: db(options.wet) })
}

/* --------------------------------------------------------------- finish */

/**
 * Makes a sound safe to ship: no DC, a clean start (it begins at zero, with
 * a fade shorter than the ear can hear as one), and a tail cut where it
 * falls `floor` dB below its peak, faded out so it doesn't click.
 */
export function finish(sig: Signal, { floor = -60, fadeIn = 0.0004, fadeOut = 0.008 } = {}): Signal {
  let out = highpass(sig, 28, 0.6)
  const top = peak(out)
  const threshold = top * db(floor)
  let end = out.length
  while (end > 0 && Math.abs(out[end - 1]!) < threshold) end--
  end = Math.min(out.length, end + samples(fadeOut * 0.25))
  out = out.slice(0, end)
  const a = samples(fadeIn)
  const r = Math.min(samples(fadeOut), out.length)
  return out.map((x, i) => {
    let g = 1
    if (i < a) g *= rise(i, a)
    if (i >= out.length - r) g *= 1 - rise(i - (out.length - r), r)
    return x * g
  })
}
