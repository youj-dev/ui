/* Notify: something arrived (a toast). Friendly and brief, a single event
 * rather than a phrase, so it never competes with a success. Centred on A5,
 * the palette's middle. */

import { NOTE, cents, lowpass, mix, pluck, room } from '../dsp.ts'
import { bell, glass, marimba, woodRoom } from './instruments.ts'
import { variant } from './types.ts'

export const notify = [
  variant('notify', 'glass', 'A small glass bell at A5, struck once, with a twin 4 cents sharp for a slow shimmer, ringing about 250 ms into a small room.', () =>
    room(mix({ sig: glass({ f0: NOTE.A5, decay: 0.42, seed: 71 }, { tilt: 1.6, grit: 0.05 }) }, { sig: glass({ f0: NOTE.A5 * cents(4), decay: 0.36, seed: 72 }, { tilt: 1.8, grit: 0 }), gain: 0.4 }), { decay: 0.3, damping: 0.55, wet: -20, seed: 73 }),
  ),
  variant('notify', 'wood', 'A marimba grace note: E5 just before A5 (45 ms), soft mallets. Da-ding.', () =>
    woodRoom(mix({ sig: marimba({ f0: NOTE.E5, decay: 0.16, seed: 74 }), gain: 0.5 }, { sig: marimba({ f0: NOTE.A5, decay: 0.3, seed: 75 }), at: 0.045 }), -23),
  ),
  variant('notify', 'digital', 'A clean FM key at A5 and its octave answering 60 ms later, quieter: a small digital ding·ding.', () =>
    mix({ sig: bell({ f0: NOTE.A5, decay: 0.28, seed: 76 }, { ratio: 1, index: 0.7, indexDecay: 0.05 }) }, { sig: bell({ f0: NOTE.A6, decay: 0.2, seed: 77 }, { ratio: 1, index: 0.4, indexDecay: 0.04 }), at: 0.06, gain: 0.3 }),
  ),
  variant('notify', 'pluck', 'A plucked string (Karplus–Strong) at A5, a soft E5 plucked 40 ms before it: a small harp figure, thumbed near the middle so it’s round, not twangy.', () =>
    woodRoom(lowpass(mix({ sig: pluck({ freq: NOTE.E5, decay: 0.22, brightness: 0.2, pick: 0.35, duration: 0.35, seed: 78 }), gain: 0.45 }, { sig: pluck({ freq: NOTE.A5, decay: 0.32, brightness: 0.28, pick: 0.32, duration: 0.45, seed: 79 }), at: 0.04 }), 2400, 0.6), -24),
  ),
]
