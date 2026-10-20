import type { MiniatureMeta } from '../engine/types'

/** VORLEN E–09, espresso machine: what a showroom shows before it mounts. */
export const espresso = {
  id: 'espresso',
  name: 'Espresso machine',
  model: 'VORLEN E–09',
  maker: 'VORLEN / PRESSURE WORKS',
  study: '017',
  spec: 'E–09 / DUAL SPOUT · 1.2 L',
  label: 'Espresso machine, VORLEN E–09',
  description: 'Espresso machine with a cup warmer and two cups on top, a lever group head with cup lights, a pressure gauge, twin spouts over a cup on its saucer, a steam wand and a reservoir window.',
  keys: [
    { keys: ['o'], caps: ['O'], label: 'power' },
    { keys: ['1'], caps: ['1'], label: 'single' },
    { keys: ['2'], caps: ['2'], label: 'double' },
    { keys: ['s'], caps: ['S'], label: 'steam' },
    { keys: ['r'], caps: ['R'], label: 'refill' },
    { keys: ['c'], caps: ['C'], label: 'cup' },
  ],
  initial: { readout: '0.0 bar · 00 s', state: 'STANDBY', pressed: {  } },
  viewBox: '-158.8320137979413 -210 389.544136109991 425',
  progress: false,
} as const satisfies MiniatureMeta
