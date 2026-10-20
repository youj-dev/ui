import type { MiniatureMeta } from '../engine/types'

/** ORYNT T–12, oscilloscope: what a showroom shows before it mounts. */
export const oscilloscope = {
  id: 'oscilloscope',
  name: 'Oscilloscope',
  model: 'ORYNT T–12',
  maker: 'ORYNT / SIGNAL INSTRUMENTS',
  study: '024',
  spec: 'T–12 + G–03 / CRT · 20 MHz · 0.5–5 kHz',
  label: 'Oscilloscope, ORYNT T–12',
  description: 'A CRT oscilloscope with a sunshade, volts and time dials, trigger lamp and position knobs, connected by two BNC cables to a compact generator with an amber frequency display, lit waveform keys and an output lamp. Select sine, square or saw, change scales and frequency, switch the output or hold the trace.',
  keys: [
    { keys: ['1', '2', '3'], caps: ['1–3'], label: 'sine / square / saw' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑ ↓'], label: 'volts/div' },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['← →'], label: 'time/div' },
    { keys: ['f'], caps: ['F'], label: 'frequency' },
    { keys: ['g'], caps: ['G'], label: 'output' },
    { keys: [' '], caps: ['Space'], label: 'hold' },
    { keys: ['o'], caps: ['O'], label: 'power' },
  ],
  initial: { readout: 'Sine · 1 V/div · 0.2 ms/div', state: 'LIVE · 1 kHz · 4 Vpp', pressed: {  } },
  viewBox: '-141.9038105676658 -161 494.25179425495014 542.5',
  progress: false,
} as const satisfies MiniatureMeta
