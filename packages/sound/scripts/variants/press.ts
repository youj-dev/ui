/* Presses, choices and detents: the small, frequent sounds. A tap is the
 * body of a press; a select is lighter and higher, a choice set down; a tick
 * is the smallest, a detent under a finger. All under 60 ms to the ear. */

import { NOTE, contact, envelope, mix, sine } from '../dsp.ts'
import { blip, block, felt, glass, glassRoom, woodRoom } from './instruments.ts'
import { variant } from './types.ts'

export const press = [
  variant('tap', 'wood', 'A rubber mallet on a small hollow block at 760 Hz: a warm tock with a breath of wood grain, over in 40 ms.', () =>
    woodRoom(block({ f0: 760, decay: 0.05 })),
  ),
  variant('tap', 'glass', 'A fingernail on a glass bead: a clear ping at D6 (1.2 kHz), its one overtone kept low, in a small bright room.', () =>
    glassRoom(glass({ f0: NOTE.D6, decay: 0.07 })),
  ),
  variant('tap', 'digital', 'A sine key at D6 that starts bright (1:1 FM) and settles to pure in 15 ms, with a whisper of a click. Dry.', () =>
    blip({ f0: NOTE.D6, decay: 0.04 }),
  ),
  variant('tap', 'felt', 'A felt-covered key: a low-mid thock at A4 and the soft thump of the felt. Nothing above 2 kHz.', () =>
    felt({ f0: NOTE.A4, decay: 0.05 }),
  ),

  variant('select', 'wood', 'A smaller block, higher (1.1 kHz) and quicker than the tap: a light tik.', () =>
    woodRoom(block({ f0: 1110, decay: 0.032, seed: 12 }, { mallet: 0.0006, grit: 0.12 }), -28),
  ),
  variant('select', 'glass', 'A thin glass rod tapped at E6: a small, clear tink, quieter than the tap.', () =>
    glassRoom(glass({ f0: NOTE.E6, decay: 0.055, seed: 13 }, { tilt: 1.6, grit: 0.06 }), -25),
  ),
  variant('select', 'digital', 'A sine blip at E6 with a faint octave, 25 ms, bright only at the very start.', () =>
    blip({ f0: NOTE.E6, decay: 0.03, seed: 14 }, { index: 0.6, click: 0.035 }),
  ),
  variant('select', 'felt', 'A felt tick at E5: round and soft, a notch lighter than the felt tap.', () =>
    felt({ f0: NOTE.E5, decay: 0.035, seed: 15 }, { mallet: 0.0011, thump: 0.2 }),
  ),

  variant('tick', 'wood', 'The smallest woodblock, at 1.5 kHz, 12 ms: a detent under the finger.', () =>
    block({ f0: 1500, decay: 0.014, seed: 22 }, { mallet: 0.0005, grit: 0.1 }),
  ),
  variant('tick', 'glass', 'A grain of glass at G6: 20 ms, barely a ring.', () => glass({ f0: NOTE.G6, decay: 0.022, seed: 23 }, { tilt: 1.8, grit: 0.05 })),
  variant('tick', 'digital', 'Six cycles of a 1.6 kHz sine, shaped to a click: a clean 4 ms tick with no ring.', () =>
    mix({ sig: envelope(sine(0.005, NOTE.G6), { attack: 0.0008, decay: 0.004 }) }, { sig: contact(0.0001, [3000, 9000], 24), gain: 0.02 }),
  ),
  variant('tick', 'felt', 'A soft felt tk at A5, 15 ms.', () => felt({ f0: NOTE.A5, decay: 0.016, seed: 25 }, { mallet: 0.0009, thump: 0.15 })),
]
