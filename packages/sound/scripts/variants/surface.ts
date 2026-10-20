/* Surfaces: a dialog or sheet arriving and leaving. Softer onsets than the
 * struck sounds (a surface slides in; nothing is hit), rising as it opens,
 * falling as it closes; close is shorter and quieter, as the exit motion is. */

import { NOTE, band, glide, mix, noise, partials, sweep, swell } from '../dsp.ts'
import { felt, glass, glassRoom } from './instruments.ts'
import { variant } from './types.ts'

/** A breath: pink noise through a band that sweeps from `from` to `to` Hz as it swells. */
const breath = (from: number, to: number, time: number, attack: number, release: number, seed: number) =>
  band(swell(sweep(noise(attack + release + 0.02, seed, 'pink'), 'bandpass', glide(from, to, time), 1.2), attack, release), 200, 5000)

export const surface = [
  variant('open', 'air', 'A breath of pink noise through a soft band sweeping 350 Hz → 1.6 kHz as it swells (60 ms in, 90 out), set down with a faint felt tick as the surface lands.', () =>
    mix({ sig: breath(350, 1600, 0.11, 0.06, 0.09, 81) }, { sig: felt({ f0: NOTE.E5, decay: 0.03, seed: 82 }, { thump: 0.1 }), at: 0.055, gain: 0.12 }),
  ),
  variant('close', 'air', 'The breath falling away: a faint tick as the surface lifts, then 1.4 kHz → 300 Hz, shorter and softer.', () =>
    mix({ sig: felt({ f0: NOTE.D5, decay: 0.025, seed: 83 }, { thump: 0.1 }), gain: 0.1 }, { sig: breath(1400, 300, 0.09, 0.02, 0.085, 84), at: 0.004 }),
  ),
  variant('open', 'glass', 'Two glass notes rolled 45 ms apart, A5 then a fourth up to D6, struck softly so they bloom rather than ping.', () =>
    glassRoom(mix({ sig: glass({ f0: NOTE.A5, decay: 0.2, seed: 85 }, { mallet: 0.0012, grit: 0 }), gain: 0.6 }, { sig: glass({ f0: NOTE.D6, decay: 0.28, seed: 86 }, { mallet: 0.001, grit: 0 }), at: 0.045 }), -21),
  ),
  variant('close', 'glass', 'D6 then down to A5, quieter and shorter: the bloom folding back.', () =>
    glassRoom(mix({ sig: glass({ f0: NOTE.D6, decay: 0.14, seed: 87 }, { mallet: 0.0012, grit: 0 }), gain: 0.7 }, { sig: glass({ f0: NOTE.A5, decay: 0.18, seed: 88 }, { mallet: 0.0014, grit: 0 }), at: 0.04 }), -23),
  ),
  variant('open', 'digital', 'A sine gliding up a fourth (A5 → D6) in 60 ms under a 35 ms swell, a faint octave on top.', () =>
    swell(partials(0.13, glide(NOTE.A5, NOTE.D6, 0.06), [
      { ratio: 1, gain: 1, decay: 10 },
      { ratio: 2, gain: 0.12, decay: 10 },
    ]), 0.035, 0.08),
  ),
  variant('close', 'digital', 'The same sine gliding back down, D6 → A5, faster (45 ms) and quieter.', () =>
    swell(partials(0.1, glide(NOTE.D6, NOTE.A5, 0.045), [
      { ratio: 1, gain: 1, decay: 10 },
      { ratio: 2, gain: 0.1, decay: 10 },
    ]), 0.015, 0.075),
  ),
  variant('open', 'felt', 'A soft fwoomp: pink noise swelling as a low-pass opens 300 Hz → 1.5 kHz, landing on a felt thock at E5.', () =>
    mix({ sig: band(swell(sweep(noise(0.16, 89, 'pink'), 'lowpass', glide(300, 1500, 0.08), 0.9), 0.06, 0.07), 260, 4000) }, { sig: felt({ f0: NOTE.E5, decay: 0.045, seed: 90 }), at: 0.055, gain: 0.55 }),
  ),
  variant('close', 'felt', 'The thock first (D5), then the breath closing down 1.2 kHz → 250 Hz.', () =>
    mix({ sig: felt({ f0: NOTE.D5, decay: 0.035, seed: 91 }), gain: 0.5 }, { sig: band(swell(sweep(noise(0.12, 92, 'pink'), 'lowpass', glide(1200, 250, 0.07), 0.9), 0.015, 0.075), 260, 4000), at: 0.008 }),
  ),
]
