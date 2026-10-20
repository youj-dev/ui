/* Halo: short, swelling chord pads. Several softly voiced harmonic stacks
 * bloom together; an opening low-pass and a very quiet detuned upper voice
 * add motion and shimmer. Even tap/tick are miniature chords, not strikes. */
import { NOTE, SR, cents, mix, partials, sweep, swell, type Signal } from '../dsp.ts'
import { variant } from './types.ts'

function pad(notes: number[], duration: number, attack: number, rising = true): Signal {
  const voices = notes.map((f, i) => {
    const pitch = (t: number) => f * cents((rising ? -1 : 1) * 9 * Math.exp(-t / (duration * 0.22)) + 2 * Math.sin(2 * Math.PI * 4.6 * t + i))
    const tone = partials(duration, pitch, [
      { ratio: 1, gain: 1, decay: 10 },
      { ratio: 2, gain: 0.2, decay: 10, detune: i % 2 ? 3 : -3 },
      { ratio: 3, gain: 0.06, decay: 10 },
      { ratio: 4, gain: 0.022, decay: 10, detune: 5 },
    ], 0)
    // Upper chord tones blossom later, shifting the spectral centre
    // continuously; they are simultaneous pads, never a strummed sequence.
    const moving = tone.map((x, n) => x * (i === 0 ? 1 : 0.42 + 0.48 * (0.5 - 0.5 * Math.cos(Math.PI * n / tone.length))))
    return { sig: moving, gain: i === 0 ? 0.82 : 0.65 / Math.sqrt(i) }
  })
  const shimmer = partials(duration, notes.at(-1)!, [{ ratio: 2, gain: 0.028, decay: 10, detune: 7 }], 0)
    .map((x, i) => x * (0.82 + 0.18 * Math.sin(2 * Math.PI * 2.8 * i / SR)))
  const chord = mix(...voices, { sig: shimmer })
  const opening = sweep(chord, 'lowpass', (t) => 1000 + 1400 * Math.sin(Math.PI * t / duration) ** 2, 0.6)
  return swell(opening, attack, duration - attack)
}

export const halo = [
  variant('tap', 'halo', 'A 52 ms E4/B4/E5 pad blooms as one soft chord, with opening harmonics and a trace of detuned shimmer.', () => pad([NOTE.E4, NOTE.B4, NOTE.E5], 0.052, 0.012)),
  variant('select', 'halo', 'A lighter 44 ms A4/E5 pad gently brightens and floats upward; a tiny chord with no impact layer.', () => pad([NOTE.A4, NOTE.E5], 0.044, 0.01)),
  variant('toggleOn', 'halo', 'An E4/B4/E5 chord swells open in 31 ms, its upper voices blooming together into a calm 145 ms pad.', () => pad([NOTE.E4, NOTE.B4, NOTE.E5], 0.145, 0.031)),
  variant('toggleOff', 'halo', 'The same warm chord leans downward and fades inward over 125 ms, keeping its soft pad onset.', () => pad([NOTE.E4, NOTE.B4, NOTE.E5], 0.125, 0.025, false)),
  variant('success', 'halo', 'A full E4/G4/B4/E5 chord blooms over 58 ms, then rests in 330 ms of warm harmonic shimmer: a calm, satisfying arrival.', () => pad([NOTE.E4, NOTE.G4, NOTE.B4, NOTE.E5], 0.33, 0.058)),
  variant('error', 'halo', 'Two low chord swells gently fold G4/D5 into E4/B4 with downward tuning; a clear two-part refusal, softly voiced.', () =>
    mix({ sig: pad([NOTE.G4, NOTE.D5], 0.105, 0.022, false), gain: 0.85 }, { sig: pad([NOTE.E4, NOTE.B4], 0.14, 0.029, false), at: 0.103 })),
  variant('notify', 'halo', 'An A4/E5/B5 chord breathes into focus over 46 ms, with upper voices opening and a tiny detuned halo.', () => pad([NOTE.A4, NOTE.E5, NOTE.B5], 0.255, 0.046)),
  variant('open', 'halo', 'A warm E4/A4/B4/E5 pad expands as one chord under a 52 ms attack, opening the filter and lifting its tuning slightly.', () => pad([NOTE.E4, NOTE.A4, NOTE.B4, NOTE.E5], 0.265, 0.052)),
  variant('close', 'halo', 'The same soft chord settles downward into a 210 ms fade, with a 38 ms swelling onset and inward-moving harmonics.', () => pad([NOTE.E4, NOTE.A4, NOTE.B4, NOTE.E5], 0.21, 0.038, false)),
  variant('tick', 'halo', 'A 28 ms A4/E5 micro-pad: a 6 ms chord bloom with moving upper harmonics and the faintest shimmer.', () => pad([NOTE.A4, NOTE.E5], 0.028, 0.006)),
]
