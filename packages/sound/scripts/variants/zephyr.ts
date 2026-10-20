/* Zephyr: a tiny blown pipe. Harmonic partials share a breath-shaped onset;
 * filtered pink air and two very quiet reflections make the longer notes
 * spacious. All notes use E minor pentatonic, including the outcome phrases. */

import { NOTE, band, mix, noise, partials, room, swell, type Signal } from '../dsp.ts'
import { variant } from './types.ts'

function pipe(f0: number, duration: number, seed: number, attack = 0.007): Signal {
  const release = duration - attack
  const tone = partials(duration + 0.005, f0, [
    { ratio: 1, gain: 1, decay: 10 },
    { ratio: 2, gain: 0.15, decay: 10 },
    { ratio: 3, gain: 0.022, decay: 10 },
  ], attack * 0.5)
  const air = band(noise(duration + 0.005, seed, 'pink'), 500, 1850)
  return swell(mix({ sig: tone }, { sig: air, gain: 0.32 }), attack, release)
}

const space = (sig: Signal) => room(sig, { decay: 0.19, damping: 0.35, wet: -23, predelay: 0.009, seed: 401 })

export const zephyr = [
  variant('tap', 'zephyr', 'A 36 ms puff through a tiny E5 pipe, its soft harmonic body mixed with filtered pink breath. No room on frequent cues.', () => pipe(NOTE.E5, 0.036, 403, 0.004)),
  variant('select', 'zephyr', 'A lighter A5 breath-note on the same pipe, shaped into a 30 ms puff.', () => pipe(NOTE.A5, 0.03, 405, 0.004)),
  variant('toggleOn', 'zephyr', 'Two short pipe breaths, A4–E5, 27 ms apart, with the upper note opening a little longer.', () =>
    mix({ sig: pipe(NOTE.A4, 0.027, 407, 0.004), gain: 0.45 }, { sig: pipe(NOTE.E5, 0.047, 409, 0.005), at: 0.027 })),
  variant('toggleOff', 'zephyr', 'E5–A4 in 25 ms, the second breath shorter: the pipe gently exhales.', () =>
    mix({ sig: pipe(NOTE.E5, 0.029, 411, 0.004), gain: 0.7 }, { sig: pipe(NOTE.A4, 0.036, 413, 0.005), at: 0.025 })),
  variant('success', 'zephyr', 'A tiny pentatonic pipe phrase, E5–G5–B5 at 0, 74 and 151 ms, the last breath resting in a quiet synthetic room.', () =>
    space(mix({ sig: pipe(NOTE.E5, 0.12, 415, 0.012), gain: 0.68 }, { sig: pipe(NOTE.G5, 0.13, 417, 0.012), at: 0.074, gain: 0.78 }, { sig: pipe(NOTE.B5, 0.185, 419, 0.014), at: 0.151 }))),
  variant('error', 'zephyr', 'Two contained breaths descend G4–E4, 87 ms apart, without room. A clear low answer, still soft and harmonic.', () =>
    mix({ sig: pipe(NOTE.G4, 0.078, 421, 0.008) }, { sig: pipe(NOTE.E4, 0.096, 423, 0.008), at: 0.087, gain: 0.92 })),
  variant('notify', 'zephyr', 'A small A4–E5–A5 pipe figure at 0, 57 and 117 ms, airy and spacious but shorter than the success phrase.', () =>
    space(mix({ sig: pipe(NOTE.A4, 0.072, 425, 0.009), gain: 0.48 }, { sig: pipe(NOTE.E5, 0.09, 427, 0.009), at: 0.057, gain: 0.7 }, { sig: pipe(NOTE.A5, 0.14, 429, 0.011), at: 0.117 }))),
  variant('open', 'zephyr', 'A5 and E6 pipe breaths bloom 35 ms apart, softly overlapping into the same quiet room.', () =>
    space(mix({ sig: pipe(NOTE.A5, 0.105, 431, 0.018), gain: 0.55 }, { sig: pipe(NOTE.E6, 0.125, 433, 0.022), at: 0.035 }))),
  variant('close', 'zephyr', 'The pipe bloom folds E6–A5, 29 ms apart, with shorter breaths and a quieter room tail.', () =>
    space(mix({ sig: pipe(NOTE.E6, 0.065, 435, 0.01), gain: 0.65 }, { sig: pipe(NOTE.A5, 0.085, 437, 0.012), at: 0.029 }))),
  variant('tick', 'zephyr', 'An 18 ms A5 breath-note, the pipe reduced to its smallest soft articulation.', () => pipe(NOTE.A5, 0.018, 439, 0.003)),
]
