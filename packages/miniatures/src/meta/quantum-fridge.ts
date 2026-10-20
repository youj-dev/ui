import type { MiniatureMeta } from '../engine/types'

/** QELVA DR–5, dilution refrigerator: what a showroom shows before it mounts. */
export const quantumFridge = {
  id: 'quantum-fridge',
  name: 'Dilution refrigerator',
  model: 'QELVA DR–5',
  maker: 'QELVA / CRYOGENIC SYSTEMS',
  study: '036',
  spec: 'DR–5 / 5 STAGES · 10 mK BASE · 14 COAX',
  label: 'Dilution refrigerator, QELVA DR–5',
  description: 'A gold five-stage chandelier hanging from a frame, a cut-away vacuum can on a scissor lift, a gas handling cabinet and a control rack with a monitor. Raise the vacuum can, cool the stages from room temperature to ten millikelvin, then send microwave pulses down the coax lines to read out and flip a superconducting qubit.',
  keys: [
    { keys: ['o'], caps: ['O'], label: 'vacuum can', toggle: true },
    { keys: ['c'], caps: ['C'], label: 'cool down', toggle: true },
    { keys: ['w'], caps: ['W'], label: 'warm up' },
    { keys: [' '], caps: ['Space'], label: 'readout pulse' },
    { keys: ['x'], caps: ['X'], label: 'π-pulse' },
  ],
  initial: {
    readout: 'MXC 300 K · STILL 300 K · DAY 0.0',
    state: 'CAN OPEN · O TO SEAL',
    pressed: { o: false, c: false },
  },
  viewBox: '-161.22431864335456 -299 339.7691453623979 386',
  progress: false,
} as const satisfies MiniatureMeta
