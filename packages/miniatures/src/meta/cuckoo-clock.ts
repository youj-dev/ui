import type { MiniatureMeta } from '../engine/types'

/** WALDEGG K–12, cuckoo clock: what a showroom shows before it mounts. */
export const cuckooClock = {
  id: 'cuckoo-clock',
  name: 'Cuckoo clock',
  model: 'WALDEGG K–12',
  maker: 'WALDEGG / UHRENBAU',
  study: '043',
  spec: 'K–12 / 1-DAY MOVEMENT · CUCKOO ON THE HOUR + HALF',
  label: 'Cuckoo clock, WALDEGG K–12',
  description: 'A chalet cuckoo clock with a shingled roof, fretwork bargeboards, a carved bird finial, a dial in a leaf wreath, a shuttered side window with a flower box, two pine-cone weights and a swinging leaf pendulum. On the hour the door opens and the bird calls.',
  keys: [
    { keys: ['h'], caps: ['H'], label: 'next hour' },
    { keys: [' '], caps: ['Space'], label: 'stop', toggle: true },
    { keys: ['w'], caps: ['W'], label: 'wind' },
    { keys: ['f'], caps: ['F'], label: 'fast ×60', toggle: true },
  ],
  initial: { readout: '00:00:00', state: 'RUNNING', pressed: { ' ': false, f: false } },
  viewBox: '-42.64101615137754 -109 114.726896031426 248',
  progress: false,
} as const satisfies MiniatureMeta
