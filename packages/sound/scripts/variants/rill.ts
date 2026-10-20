/* Rill: oscillators, never struck bodies. Exponential pitch dives make wet
 * droplets; rising bloops, tiny bubbles and a mono chorus keep them alive. */
import { NOTE, chorus, envelope, glide, mix, sine, swell, type Signal } from '../dsp.ts'
import { variant } from './types.ts'

function drop(from: number, to: number, duration: number, sweep = duration * 0.65): Signal {
  const tone = envelope(sine(duration, glide(from, to, sweep)), { attack: 0.002, hold: 0.003, decay: duration * 1.8 })
  return chorus(tone, { delay: 0.0027, depth: 0.0003, rate: 7.3, wet: 0.13 })
}
const bubble = (f: number) => drop(f * 1.65, f, 0.017, 0.012)

export const rill = [
  variant('tap', 'rill', 'A wet sine droplet dives 1.4 kHz to E5 in 28 ms, with a trace of mono chorus: round but distinctly moving.', () => drop(1400, NOTE.E5, 0.052, 0.028)),
  variant('select', 'rill', 'A smaller droplet curls down from 1.9 kHz to A5 in 21 ms, leaving a tiny bubble.', () =>
    mix({ sig: drop(1900, NOTE.A5, 0.043, 0.021) }, { sig: bubble(NOTE.E6), at: 0.027, gain: 0.12 })),
  variant('toggleOn', 'rill', 'Two connected rising bloops, E5 then B5, with a high bubble as the water pops upward.', () =>
    mix({ sig: drop(360, NOTE.E5, 0.038, 0.029), gain: 0.65 }, { sig: drop(560, NOTE.B5, 0.06, 0.035), at: 0.032 }, { sig: bubble(NOTE.E6), at: 0.069, gain: 0.13 })),
  variant('toggleOff', 'rill', 'A rounded downward gulp from B5 to E5, then a quiet collapsing bubble.', () =>
    mix({ sig: drop(NOTE.B5 * 1.3, NOTE.E5, 0.075, 0.047) }, { sig: bubble(NOTE.A5), at: 0.053, gain: 0.2 })),
  variant('success', 'rill', 'Three buoyant upward sine scoops land E5–B5–E6, with tiny bubbles and a gently chorused final bloop.', () =>
    mix({ sig: drop(330, NOTE.E5, 0.095, 0.055), gain: 0.7 }, { sig: drop(500, NOTE.B5, 0.12, 0.06), at: 0.06, gain: 0.8 }, { sig: drop(660, NOTE.E6, 0.17, 0.075), at: 0.127 }, { sig: bubble(NOTE.A6), at: 0.205, gain: 0.13 })),
  variant('error', 'rill', 'Two falling water bloops, 1.2 kHz to G5 and A5 to E5: a gentle double gulp, never a low knock.', () =>
    mix({ sig: drop(1200, NOTE.G5, 0.086, 0.06) }, { sig: drop(NOTE.A5, NOTE.E5, 0.12, 0.078), at: 0.077, gain: 0.9 })),
  variant('notify', 'rill', 'A rising A5 water dome with two small falling bubbles: playful and softly wet.', () =>
    mix({ sig: drop(440, NOTE.A5, 0.16, 0.052) }, { sig: bubble(NOTE.E6), at: 0.066, gain: 0.22 }, { sig: bubble(NOTE.A6), at: 0.105, gain: 0.12 })),
  variant('open', 'rill', 'A continuous exponential sine scoop from E4 to B5, swelling as it rises, with two surface bubbles.', () =>
    mix({ sig: chorus(swell(sine(0.19, glide(NOTE.E4, NOTE.B5, 0.115)), 0.012, 0.178)) }, { sig: bubble(NOTE.E6), at: 0.092, gain: 0.15 }, { sig: bubble(NOTE.A6), at: 0.133, gain: 0.1 })),
  variant('close', 'rill', 'The water folds downward from E6 to E5 in 85 ms, with a small final bubble and no thump.', () =>
    mix({ sig: chorus(swell(sine(0.15, glide(NOTE.E6, NOTE.E5, 0.085)), 0.005, 0.145)) }, { sig: bubble(NOTE.A5), at: 0.092, gain: 0.12 })),
  variant('tick', 'rill', 'A crisp 20 ms microbubble, diving 2.2 kHz to B5; even the smallest cue has a wet pitch curl.', () => drop(2200, NOTE.B5, 0.021, 0.015)),
]
