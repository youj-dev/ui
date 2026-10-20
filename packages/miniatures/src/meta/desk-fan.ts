import type { MiniatureMeta } from '../engine/types'

/** VENTORA 12, desk fan: what a showroom shows before it mounts. */
export const deskFan = {
  id: 'desk-fan',
  name: 'Desk fan',
  model: 'VENTORA 12',
  maker: 'VENTORA / ELECTRIC FANS',
  study: '064',
  spec: 'VENTORA 12 / 12" BRASS BLADES · 3 SPEEDS · OSCILLATING',
  label: 'Desk fan, VENTORA 12',
  description: 'A cream enamel base and motor, a domed chrome cage around four brass blades, and paper streamers tied to the cage. Turn the speed knob from off through three speeds and the brass blades blur; pull the oscillation knob and the head sweeps from side to side; tilt the head; the paper streamers lift and flutter with the airflow.',
  keys: [
    { keys: ['1', '2', '3'], caps: ['1–3'], label: 'speed' },
    { keys: ['0'], caps: ['0'], label: 'off' },
    { keys: ['o'], caps: ['O'], label: 'oscillate', toggle: true },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'tilt' },
  ],
  initial: { readout: 'OFF · 0 RPM · OSC OFF', state: 'STILL · PRESS 1–3', pressed: { o: false } },
  viewBox: '-72.35382907247958 -70.82495324797985 144.70765814495917 176.82495324797986',
  progress: false,
} as const satisfies MiniatureMeta
