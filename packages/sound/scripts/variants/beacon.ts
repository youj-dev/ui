/* Beacon: short, dry, stationary pure-sine pings. Each note has one smooth
 * onset and a natural exponential decay; two-note gestures use distinct
 * pitches, with no delayed copies or repeated tails. */
import { NOTE, envelope, mix, sine, type Signal } from '../dsp.ts'
import { variant } from './types.ts'

function ping(f: number, duration: number, attack = 0.0045): Signal {
  return envelope(sine(duration, f), { attack, decay: duration * 0.95 })
}

export const beacon = [
  variant('tap', 'beacon', 'One dry 36 ms E6 sine ping: a short, pure contact with a rounded onset and natural decay.', () => ping(NOTE.E6, 0.036, 0.003)),
  variant('select', 'beacon', 'One lighter 31 ms A6 sine ping, softly rounded and cleanly decaying at a steady pitch.', () => ping(NOTE.A6, 0.031, 0.0028)),
  variant('toggleOn', 'beacon', 'Two distinct dry pings rise E5–B5, 38 ms apart; a lighter pickup lands on a clear upper note.', () =>
    mix({ sig: ping(NOTE.E5, 0.03, 0.0035), gain: 0.65 }, { sig: ping(NOTE.B5, 0.048, 0.004), at: 0.038 })),
  variant('toggleOff', 'beacon', 'Two distinct dry pings fall B5–E5, 38 ms apart, with a softer lower landing.', () =>
    mix({ sig: ping(NOTE.B5, 0.03, 0.0035) }, { sig: ping(NOTE.E5, 0.042, 0.004), at: 0.038, gain: 0.82 })),
  variant('success', 'beacon', 'Two dry sine pings rise E5–B5, 90 ms apart; a soft pickup resolves into a longer, satisfying upper note.', () =>
    mix({ sig: ping(NOTE.E5, 0.08), gain: 0.78 }, { sig: ping(NOTE.B5, 0.116, 0.005), at: 0.09 })),
  variant('error', 'beacon', 'Two lower dry sine pings fall G4–E4, 94 ms apart, with rounded onsets and a gentle lower answer.', () =>
    mix({ sig: ping(NOTE.G4, 0.071, 0.005) }, { sig: ping(NOTE.E4, 0.087, 0.0055), at: 0.094, gain: 0.9 })),
  variant('notify', 'beacon', 'One clear 105 ms A5 sine ping with a calm onset and natural decay.', () => ping(NOTE.A5, 0.105, 0.005)),
  variant('open', 'beacon', 'Two rounded dry pings rise E5–E6, 52 ms apart, with a brighter upper note opening the gesture.', () =>
    mix({ sig: ping(NOTE.E5, 0.044, 0.006), gain: 0.65 }, { sig: ping(NOTE.E6, 0.07, 0.006), at: 0.052 })),
  variant('close', 'beacon', 'Two shorter dry pings fold E6–E5, 44 ms apart, settling into a softer lower note.', () =>
    mix({ sig: ping(NOTE.E6, 0.036, 0.005) }, { sig: ping(NOTE.E5, 0.052, 0.005), at: 0.044, gain: 0.8 })),
  variant('tick', 'beacon', 'One tiny 18 ms A6 sine ping: high, softly rounded and immediately clean.', () => ping(NOTE.A6, 0.018, 0.0018)),
]
