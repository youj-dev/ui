import type { MiniatureMeta } from '../engine/types'

/** CATHODA N6, nixie clock: what a showroom shows before it mounts. */
export const nixieClock = {
  id: 'nixie-clock',
  name: 'Nixie clock',
  model: 'CATHODA N6',
  maker: 'CATHODA / TIMEPIECES',
  study: '065',
  spec: 'N6 / 6 × IN–14 STYLE TUBES · 170 V · WALNUT',
  label: 'Nixie clock, CATHODA N6',
  description: 'Six glowing number tubes and two neon colon bulbs on a walnut base with brass buttons and a small exposed control board. Six side-view Nixie tubes show the live time in orange neon. Set the hours and minutes, run the slot-machine cathode cycle, switch between 12 and 24 hours, and dim the tubes or turn the room lights out.',
  keys: [
    { keys: ['s'], caps: ['S'], label: 'set' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'adjust' },
    { keys: ['c'], caps: ['C'], label: 'cycle' },
    { keys: ['d'], caps: ['D'], label: 'dim / night' },
    { keys: ['h'], caps: ['H'], label: '12 / 24', toggle: true },
  ],
  initial: { readout: '00:00:00 · 24H · DAY', state: 'RUNNING', pressed: { h: false } },
  viewBox: '-70.88972745734182 -88 273.41531628991834 244',
  progress: false,
} as const satisfies MiniatureMeta
