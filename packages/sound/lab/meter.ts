/* The measurements the render and the Sound builder share, so a file someone
 * brings is matched to the pack by the very meter the pack was levelled with:
 *
 * - loudness: ITU-R BS.1770 K-weighting, the loudest window of a given
 *   length (the render levels every sound over its loudest 100 ms);
 * - true peak, 4× oversampled, so nothing clips between samples;
 * - the waveform bars the builder draws.
 *
 * Plain arithmetic with no imports, so it runs in Node and in the browser.
 * Signals are mono at 48 kHz: K-weighting's coefficients are for that rate. */

export const SAMPLE_RATE = 48_000

/* BS.1770 K-weighting at 48 kHz: a high shelf (the head), then the RLB high-pass. */
export function kWeight(sig: ArrayLike<number>): Float64Array {
  const stages: [number[], number[]][] = [
    [
      [1.53512485958697, -2.69169618940638, 1.19839281085285],
      [-1.69065929318241, 0.73248077421585],
    ],
    [
      [1, -2, 1],
      [-1.99004745483398, 0.99007225036621],
    ],
  ]
  let out = Float64Array.from(sig)
  for (const [[b0, b1, b2], [a1, a2]] of stages) {
    let x1 = 0
    let x2 = 0
    let y1 = 0
    let y2 = 0
    out = out.map((x) => {
      const y = b0! * x + b1! * x1 + b2! * x2 - a1! * y1 - a2! * y2
      x2 = x1
      x1 = x
      y2 = y1
      y1 = y
      return y
    })
  }
  return out
}

/** Max K-weighted loudness over sliding windows of `window` seconds (the sound zero-padded to fit one). */
export function maxLoudness(weighted: Float64Array, window: number): number {
  const w = Math.round(window * SAMPLE_RATE)
  const hop = Math.round(0.005 * SAMPLE_RATE)
  const padded = new Float64Array(Math.max(weighted.length, w) + w)
  padded.set(weighted)
  const squares = new Float64Array(padded.length + 1)
  for (let i = 0; i < padded.length; i++) squares[i + 1] = squares[i]! + padded[i]! * padded[i]!
  let best = 0
  for (let start = 0; start + w <= padded.length; start += hop) best = Math.max(best, (squares[start + w]! - squares[start]!) / w)
  return -0.691 + 10 * Math.log10(Math.max(best, 1e-20))
}

/** Loudness over the loudest 100 ms, LUFS: what every sound of a cue is levelled to. */
export const loudness = (sig: ArrayLike<number>) => maxLoudness(kWeight(sig), 0.1)

/** True peak: the signal's peak between samples, found by 4× windowed-sinc oversampling. */
export function truePeak(sig: ArrayLike<number>): number {
  const taps = 16
  const kernel = (t: number) => {
    if (t === 0) return 1
    if (Math.abs(t) >= taps) return 0
    const x = Math.PI * t
    return (Math.sin(x) / x) * (0.5 + 0.5 * Math.cos((Math.PI * t) / taps))
  }
  let best = 0
  for (let n = 0; n < sig.length; n++) {
    best = Math.max(best, Math.abs(sig[n]!))
    for (const phase of [0.25, 0.5, 0.75]) {
      let y = 0
      for (let k = -taps + 1; k <= taps; k++) {
        const i = n + k
        if (i >= 0 && i < sig.length) y += sig[i]! * kernel(k - phase)
      }
      best = Math.max(best, Math.abs(y))
    }
  }
  return best
}

/** Peak level per bar over the first `window` seconds, 0–1 of the sound's peak. */
export function waveform(sig: ArrayLike<number>, bars = 48, window = 0.6): number[] {
  const span = Math.round(window * SAMPLE_RATE)
  const step = span / bars
  let top = 0
  for (let i = 0; i < sig.length; i++) top = Math.max(top, Math.abs(sig[i]!))
  return Array.from({ length: bars }, (_, bar) => {
    let high = 0
    for (let i = Math.floor(bar * step); i < Math.floor((bar + 1) * step) && i < sig.length; i++) high = Math.max(high, Math.abs(sig[i]!))
    return high / (top || 1)
  })
}
