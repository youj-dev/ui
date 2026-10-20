/* The instruments the variants are played on. Each family is one material,
 * so a pack can mix cues from one family and they sound like one object:
 *
 * - glass: a free–free bar (glass rods, a bead, the rim of a small glass),
 *   struck hard; clear, long-ringing modes in a small bright room.
 * - wood: a hollow block or a marimba bar, struck with a soft mallet; high
 *   modes die fast, so it's warm and short.
 * - digital: sines and two-operator FM with exact envelopes, bright for a
 *   few milliseconds then pure; dry.
 * - felt: a felt-covered key or hammer: a low-mid body and a soft thump,
 *   nothing bright.
 *
 * Levels here are relative; the render normalises every sound to its cue's
 * loudness. */

import {
  BODY,
  band,
  contact,
  envelope,
  fm,
  glide,
  lowpass,
  mix,
  noise,
  partials,
  room,
  strike,
  type Signal,
} from '../dsp.ts'

export interface Hit {
  f0: number
  /** Seconds the fundamental takes to fall 60 dB. */
  decay: number
  /** Level relative to the other hits in the same sound. */
  gain?: number
  seed?: number
}

/** A glass rod or bead, struck with a fingernail. */
export function glass({ f0, decay, seed = 1 }: Hit, { mallet = 0.0003, tilt = 1.4, grit = 0.08 } = {}): Signal {
  return strike({ f0, body: BODY.bar, decay, damping: 0.6, tilt, mallet, grit, gritBand: [3000, 9500], seed, duration: decay * 1.4 + 0.02 })
}

/** A small hollow woodblock, struck with a rubber mallet. */
export function block({ f0, decay, seed = 2 }: Hit, { mallet = 0.0009, grit = 0.15 } = {}): Signal {
  return strike({ f0, body: BODY.block, decay, damping: 1.5, tilt: 0.8, mallet, grit, gritBand: [900, 3800], seed, duration: decay * 1.4 + 0.02 })
}

/** A marimba bar with its tube: the fundamental held up by the resonator, the tuned overtone two octaves above. */
export function marimba({ f0, decay, seed = 3 }: Hit, { mallet = 0.0012 } = {}): Signal {
  const bar = strike({ f0, body: BODY.marimba, decay, damping: 1.3, tilt: 1, mallet, grit: 0.05, gritBand: [600, 2500], seed, duration: decay * 1.4 + 0.02 })
  const tube = strike({ f0, body: [1], decay: decay * 1.3, damping: 0, tilt: 0, mallet: mallet * 2, duration: decay * 1.8 + 0.02 })
  return mix({ sig: bar }, { sig: tube, gain: 0.35 })
}

/** A felt-covered key: a low-mid body, damped, and the soft thump of the felt. */
export function felt({ f0, decay, seed = 4 }: Hit, { mallet = 0.0014, thump = 0.3 } = {}): Signal {
  const body = strike({ f0, body: BODY.plastic, decay, damping: 1.2, tilt: 0.5, mallet, duration: decay * 1.4 + 0.02 })
  const pad = band(envelope(noise(0.03, seed, 'pink'), { attack: 0.0008, decay: 0.012 }), 250, 1400)
  return mix({ sig: body }, { sig: pad, gain: thump })
}

/** A felt piano note: a harmonic series, the upper partials dying first, and the hammer's thump. */
export function feltPiano({ f0, decay, seed = 5 }: Hit, { bend = 1 }: { bend?: number } = {}): Signal {
  const pitch = bend === 1 ? f0 : glide(f0, f0 * bend, decay * 0.5)
  const tone = partials(decay * 1.3 + 0.02, pitch, [
    { ratio: 1, gain: 1, decay },
    { ratio: 2, gain: 0.32, decay: decay * 0.5, detune: 1.5 },
    { ratio: 3, gain: 0.1, decay: decay * 0.3 },
    { ratio: 4, gain: 0.035, decay: decay * 0.2 },
  ], 0.0025)
  const thump = band(envelope(noise(0.03, seed, 'pink'), { attack: 0.001, decay: 0.014 }), 220, 1100)
  return lowpass(mix({ sig: tone }, { sig: thump, gain: 0.18 }), 2400)
}

/** A sine key: bright for its first milliseconds (1:1 FM), then pure, with a whisper of a click. */
export function blip({ f0, decay, seed = 6 }: Hit, { index = 0.9, settle = 1.02, click = 0.05 } = {}): Signal {
  const tone = envelope(fm(decay * 1.3 + 0.01, { carrier: glide(f0 * settle, f0, 0.006), ratio: 1, index, indexDecay: 0.015 }), { attack: 0.0005, decay })
  const tick = contact(0.0002, [3000, 9000], seed)
  return mix({ sig: tone }, { sig: tick, gain: click })
}

/** A soft FM bell: carrier and modulator at `ratio` (3.5 is inharmonic, bell-like; 1 is an electric piano). */
export function bell({ f0, decay, seed = 7 }: Hit, { ratio = 3.5, index = 1.6, indexDecay = 0.12 } = {}): Signal {
  const tone = envelope(fm(decay * 1.3 + 0.02, { carrier: f0, ratio, index, indexDecay }), { attack: 0.0012, decay })
  const tick = contact(0.0003, [2500, 8000], seed)
  return mix({ sig: tone }, { sig: tick, gain: 0.03 })
}

/** A little room for the glass family (bright, short). */
export const glassRoom = (sig: Signal, wet = -24) => room(sig, { decay: 0.16, damping: 0.55, wet, seed: 21 })
/** A little room for wood and felt (darker, shorter). */
export const woodRoom = (sig: Signal, wet = -27) => room(sig, { decay: 0.11, damping: 0.4, wet, seed: 22 })
