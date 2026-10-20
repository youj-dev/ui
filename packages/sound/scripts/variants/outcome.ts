/* Outcomes. These keep the intervals of the palette's first success and
 * error, the two sounds people liked: success is E5 then B5, a perfect fifth
 * up, 75 ms apart, the second ringing on; error is G4 then E4, a minor third
 * down, 80 ms apart, each knock bending down as it dies. The variants play
 * those same notes on other materials. */

import { NOTE, band, contact, envelope, glide, lowpass, mix, noise, partials, room, type Signal } from '../dsp.ts'
import { block, feltPiano, glass, marimba, woodRoom } from './instruments.ts'
import { variant } from './types.ts'

/** Two notes, the second `gap` seconds after the first. */
const pair = (first: Signal, second: Signal, gap: number, lead = 1) => mix({ sig: first, gain: lead }, { sig: second, at: gap })

/** The first palette's success note, refined: sine, a soft octave and a trace of the twelfth, struck rather than switched on. */
function chime(f0: number, decay: number, seed: number): Signal {
  const tone = partials(decay * 1.3 + 0.02, f0, [
    { ratio: 1, gain: 1, decay },
    { ratio: 2, gain: 0.2, decay: decay / 2, detune: 2 },
    { ratio: 3, gain: 0.03, decay: decay / 3 },
  ], 0.002)
  return mix({ sig: tone }, { sig: contact(0.0012, [1500, 5000], seed), gain: 0.02 })
}

/** The first palette's error knock, refined: a triangle's odd partials, bending down, with a knuckle's thump. */
function knock(from: number, decay: number, seed: number): Signal {
  const pitch = glide(from, from * 0.944, decay * 0.8)
  const tone = partials(decay * 1.3 + 0.02, pitch, [
    { ratio: 1, gain: 1, decay },
    { ratio: 3, gain: 0.11, decay: decay * 0.6 },
    { ratio: 5, gain: 0.035, decay: decay * 0.4 },
    { ratio: 7, gain: 0.015, decay: decay * 0.3 },
  ], 0.002)
  const thump = band(envelope(noise(0.02, seed, 'pink'), { attack: 0.0008, decay: 0.01 }), 200, 900)
  return lowpass(mix({ sig: tone }, { sig: thump, gain: 0.22 }), 1500, 0.5)
}

/** A band-limited square's odd partials: the classic error buzz, kept short and warm. */
function buzz(from: number, decay: number): Signal {
  const pitch = glide(from, from * 0.983, decay)
  return lowpass(
    partials(decay * 1.3 + 0.02, pitch, [1, 3, 5, 7, 9].map((n) => ({ ratio: n, gain: 1 / n, decay: decay * (n === 1 ? 1 : 0.7) }))),
    1800,
    0.6,
  )
}

export const outcome = [
  variant('success', 'classic', 'The first palette’s success, E5 then B5 a fifth up, 75 ms apart: sines with a soft octave, now struck (a breath of contact), ringing a little longer, in a small room.', () =>
    room(pair(chime(NOTE.E5, 0.2, 51), chime(NOTE.B5, 0.34, 52), 0.075, 0.88), { decay: 0.28, damping: 0.5, wet: -22, seed: 53 }),
  ),
  variant('success', 'glass', 'E5 and B5 on glass rods, 70 ms apart, ringing out into a small bright room.', () =>
    room(pair(glass({ f0: NOTE.E5, decay: 0.27, seed: 54 }, { tilt: 1.6, grit: 0.04, mallet: 0.00035 }), glass({ f0: NOTE.B5, decay: 0.37, seed: 55 }, { tilt: 1.7, grit: 0.04, mallet: 0.00035 }), 0.07, 0.85), { decay: 0.26, damping: 0.55, wet: -20, seed: 56 }),
  ),
  variant('success', 'wood', 'A marimba, E5 then B5: warm and round, the tube holding up each fundamental, the tuned overtone just audible.', () =>
    woodRoom(pair(marimba({ f0: NOTE.E5, decay: 0.29, seed: 57 }, { mallet: 0.0008 }), marimba({ f0: NOTE.B5, decay: 0.37, seed: 58 }, { mallet: 0.0008 }), 0.075, 0.85), -23),
  ),
  variant('success', 'felt', 'A felt piano, E5 then B5: the softest of the four, a hammer’s thump under two round notes.', () =>
    woodRoom(pair(feltPiano({ f0: NOTE.E5, decay: 0.28, seed: 59 }), feltPiano({ f0: NOTE.B5, decay: 0.38, seed: 60 }), 0.075, 0.85), -24),
  ),

  variant('error', 'classic', 'The first palette’s error, G4 then E4 a minor third down, 80 ms apart, each knock bending down as it dies: now with a knuckle’s thump, under 1.5 kHz.', () =>
    woodRoom(pair(knock(NOTE.G4, 0.065, 61), knock(NOTE.E4, 0.08, 62), 0.08), -25),
  ),
  variant('error', 'wood', 'Two knocks on a hollow wooden door, G4 then E4: dull, short, unmistakable.', () =>
    woodRoom(pair(block({ f0: NOTE.G4, decay: 0.07, seed: 63 }, { mallet: 0.0018, grit: 0.2 }), block({ f0: NOTE.E4, decay: 0.085, seed: 64 }, { mallet: 0.0018, grit: 0.2 }), 0.08), -23),
  ),
  variant('error', 'felt', 'Two felt piano notes, G4 then E4, each sagging a little: a gentle no that never buzzes.', () =>
    lowpass(pair(feltPiano({ f0: NOTE.G4, decay: 0.12, seed: 65 }, { bend: 0.97 }), feltPiano({ f0: NOTE.E4, decay: 0.15, seed: 66 }, { bend: 0.97 }), 0.085), 1400),
  ),
  variant('error', 'digital', 'A soft square (odd partials, band-limited under 1.8 kHz), G4 then E4, short and sagging: the classic buzz, warmed.', () =>
    pair(buzz(NOTE.G4, 0.06), buzz(NOTE.E4, 0.075), 0.08),
  ),
]
