import type { MiniatureMeta } from '../engine/types'

/** ALDERVOSS W–58, valve radio: what a showroom shows before it mounts. */
export const tubeRadio = {
  id: 'tube-radio',
  name: 'Valve radio',
  model: 'ALDERVOSS W–58',
  maker: 'ALDERVOSS / RADIO WORKS',
  study: '061',
  spec: 'W–58 / 6 VALVES · LW MW SW FM · MAGIC EYE',
  label: 'Valve radio, ALDERVOSS W–58',
  description: 'A 1950s table radio. Press a band key to switch on: the dial lamps light at once and the valves warm slowly. Tune through static and whistles to a station and the magic eye closes.',
  keys: [
    { keys: ['o'], caps: ['O'], label: 'power' },
    { keys: ['1', '2', '3', '4'], caps: ['1–4'], label: 'band' },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'tune' },
    { keys: ['s'], caps: ['S'], label: 'seek' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'volume' },
  ],
  initial: { readout: 'MW 945 kHz · VOL 6', state: 'OFF · PRESS O', pressed: {  } },
  viewBox: '-94.00446416709055 -142 372.4723393402665 300.5',
  progress: false,
} as const satisfies MiniatureMeta
