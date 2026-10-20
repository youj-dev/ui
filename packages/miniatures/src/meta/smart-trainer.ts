import type { MiniatureMeta } from '../engine/types'

/** RAVELO T–1, smart trainer: what a showroom shows before it mounts. */
export const smartTrainer = {
  id: 'smart-trainer',
  name: 'Smart trainer',
  model: 'RAVELO T–1',
  maker: 'RAVELO / INDOOR CYCLING',
  study: '038',
  spec: 'T–1 / DIRECT DRIVE · 11-SPEED · 2 200 W MAX',
  label: 'Smart trainer, RAVELO T–1',
  description: 'The rear wheel is off and the frame\'s dropouts sit on the trainer\'s axle, with the chain on its cassette and the front wheel on a riser block. Pedal and the cranks, chain and flywheel turn while the tablet shows power, cadence and speed and the trainer\'s ring lights in the power zone color. Change the resistance, shift gears or turn on the fan.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'pedal', toggle: true },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑ ↓'], label: 'resistance' },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['← →'], label: 'shift' },
    { keys: ['f'], caps: ['F'], label: 'fan', toggle: true },
  ],
  initial: {
    readout: '0 W · 0 RPM · 0.0 KM/H',
    state: 'LEVEL 4 · 50×17 · FAN OFF',
    pressed: { ' ': false, f: false },
  },
  viewBox: '-160.95636945092343 -88 250.8986557915229 248',
  progress: false,
} as const satisfies MiniatureMeta
