/* Glyph: clocked square/pulse oscillators, gated notes and exact pitch
 * steps. Light quantisation and sample-rate reduction add a chip edge. */
import { NOTE, lofi, lowpass, mix, pulse, swell, type Signal } from '../dsp.ts'
import { variant } from './types.ts'

function chip(f: number, duration: number, duty = 0.375): Signal {
  // A flat gate, not an exponentially dying contact. The last 4 ms soften
  // the release; the source retains its square/pulse identity throughout.
  const raw = pulse(duration, f, duty)
  const gate = raw.map((x, i) => {
    const t = i / 48_000
    const a = Math.min(1, t / 0.0007)
    const r = Math.min(1, (duration - t) / 0.004)
    return x * Math.sin(a * Math.PI / 2) ** 2 * Math.sin(r * Math.PI / 2) ** 2
  })
  return lowpass(lofi(gate, { bits: 7, rate: 12_000, wet: 0.15 }), 6200, 0.55)
}
const arp = (notes: number[], step: number, length = step * 0.88): Signal =>
  mix(...notes.map((f, i) => ({ sig: chip(f, length, i % 2 ? 0.5 : 0.375), at: i * step, gain: 0.85 + i / notes.length * 0.15 })))

export const glyph = [
  variant('tap', 'glyph', 'A 29 ms pulse gate at E5 with a clocked B5 answer: clear square-wave harmonics and a hint of seven-bit grit.', () => arp([NOTE.E5, NOTE.B5], 0.014, 0.013)),
  variant('select', 'glyph', 'A tiny A5–E6 two-step pulse selection, with exact pitches and no slide.', () => arp([NOTE.A5, NOTE.E6], 0.012, 0.011)),
  variant('toggleOn', 'glyph', 'Three clocked pulse steps E5–A5–B5, with a slightly held final square gate.', () =>
    mix({ sig: arp([NOTE.E5, NOTE.A5], 0.018) }, { sig: chip(NOTE.B5, 0.036, 0.5), at: 0.036 })),
  variant('toggleOff', 'glyph', 'The same chip latch steps B5–A5–E5, landing in a shorter square gate.', () => arp([NOTE.B5, NOTE.A5, NOTE.E5], 0.019, 0.022)),
  variant('success', 'glyph', 'A quick five-step E5–G5–B5–E6–B5 pulse arpeggio resolves in a held E6 square: a tasteful game reward.', () =>
    mix({ sig: arp([NOTE.E5, NOTE.G5, NOTE.B5, NOTE.E6, NOTE.B5], 0.025, 0.021) }, { sig: chip(NOTE.E6, 0.092, 0.5), at: 0.135 })),
  variant('error', 'glyph', 'Two gently rounded square gates step A5–G5–E5, with a rest before the last: a precise digital refusal.', () =>
    lowpass(mix({ sig: arp([NOTE.A5, NOTE.G5], 0.038, 0.032), gain: 0.8 }, { sig: chip(NOTE.E5, 0.054, 0.5), at: 0.103 }), 3700, 0.55)),
  variant('notify', 'glyph', 'B5–E6–B5, three short pulse gates with a little space between: a compact digital message.', () => arp([NOTE.B5, NOTE.E6, NOTE.B5], 0.045, 0.032)),
  variant('open', 'glyph', 'A four-step pulse staircase E5–G5–B5–E6, rising in exact 24 ms increments under a small global swell.', () => swell(arp([NOTE.E5, NOTE.G5, NOTE.B5, NOTE.E6], 0.024, 0.031), 0.004, 0.105)),
  variant('close', 'glyph', 'E6–B5–G5–E5, the pulse staircase folds down in 19 ms increments.', () => arp([NOTE.E6, NOTE.B5, NOTE.G5, NOTE.E5], 0.019, 0.021)),
  variant('tick', 'glyph', 'A crisp E6–B5 pulse microstep in 15 ms: a real chip gate, with no falling sine or resonant knock.', () => arp([NOTE.E6, NOTE.B5], 0.008, 0.0075)),
]
