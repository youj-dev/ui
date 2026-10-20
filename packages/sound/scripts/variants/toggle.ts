/* Toggles: a latch. Two contacts a few tens of milliseconds apart fuse into
 * one event (a flam), and the step between them says which way it went: on
 * steps up to its louder second contact, off steps down and lands softer,
 * with a softer mallet. No glides: a sliding pitch reads as a cartoon. */

import { NOTE, mix, type Signal } from '../dsp.ts'
import { blip, block, felt, glass, glassRoom, woodRoom } from './instruments.ts'
import { variant } from './types.ts'

/** Two contacts: `first` at `lead` of the level of `second`, `gap` seconds before it. */
const latch = (first: Signal, second: Signal, gap: number, lead = 0.45) => mix({ sig: first, gain: lead }, { sig: second, at: gap })

export const toggle = [
  variant('toggleOn', 'wood', 'A wooden latch catching: two block contacts 24 ms apart, G5 then a step up to A5, the second louder.', () =>
    woodRoom(latch(block({ f0: NOTE.G5, decay: 0.03, seed: 31 }), block({ f0: NOTE.A5, decay: 0.04, seed: 32 }), 0.024)),
  ),
  variant('toggleOff', 'wood', 'The latch letting go: A5 then down to G5, softer mallets, the second contact landing quieter.', () =>
    woodRoom(latch(block({ f0: NOTE.A5, decay: 0.028, seed: 33 }, { mallet: 0.0013 }), block({ f0: NOTE.G5, decay: 0.032, seed: 34 }, { mallet: 0.0013 }), 0.024, 0.6)),
  ),
  variant('toggleOn', 'glass', 'Two glass taps 20 ms apart, D6 then a step up to E6: a bright little click-in.', () =>
    glassRoom(latch(glass({ f0: NOTE.D6, decay: 0.04, seed: 35 }), glass({ f0: NOTE.E6, decay: 0.06, seed: 36 }), 0.02)),
  ),
  variant('toggleOff', 'glass', 'E6 then down to D6, the second tap softer and duller.', () =>
    glassRoom(latch(glass({ f0: NOTE.E6, decay: 0.035, seed: 37 }, { mallet: 0.0005 }), glass({ f0: NOTE.D6, decay: 0.045, seed: 38 }, { mallet: 0.0006, tilt: 1.8 }), 0.02, 0.6)),
  ),
  variant('toggleOn', 'digital', 'Two sine keys 28 ms apart, A5 then a step up to B5, each bright for an instant.', () =>
    latch(blip({ f0: NOTE.A5, decay: 0.03, seed: 39 }, { click: 0.03 }), blip({ f0: NOTE.B5, decay: 0.045, seed: 40 }), 0.028),
  ),
  variant('toggleOff', 'digital', 'B5 then down to A5, the second key purer and quieter.', () =>
    latch(blip({ f0: NOTE.B5, decay: 0.028, seed: 41 }, { click: 0.03 }), blip({ f0: NOTE.A5, decay: 0.035, seed: 42 }, { index: 0.5, click: 0 }), 0.028, 0.6),
  ),
  variant('toggleOn', 'felt', 'A felt switch: two soft contacts 26 ms apart, D5 then a step up to E5.', () =>
    latch(felt({ f0: NOTE.D5, decay: 0.03, seed: 43 }, { thump: 0.2 }), felt({ f0: NOTE.E5, decay: 0.045, seed: 44 }), 0.026),
  ),
  variant('toggleOff', 'felt', 'E5 then down to D5, rounder and quieter, like a key let back up.', () =>
    latch(felt({ f0: NOTE.E5, decay: 0.028, seed: 45 }, { thump: 0.2, mallet: 0.0018 }), felt({ f0: NOTE.D5, decay: 0.035, seed: 46 }, { mallet: 0.0018 }), 0.026, 0.6),
  ),
]
