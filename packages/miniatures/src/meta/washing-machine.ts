import type { MiniatureMeta } from '../engine/types'

/** AVELIN W–06, washing machine: what a showroom shows before it mounts. */
export const washingMachine = {
  id: 'washing-machine',
  name: 'Washing machine',
  model: 'AVELIN W–06',
  maker: 'AVELIN / FABRIC CARE',
  study: '026',
  spec: 'W–06 / 6 KG · 1 200 RPM · TIME ×60',
  label: 'Washing machine, AVELIN W–06',
  description: 'Open the round glass door, load the laundry from the basket, close the door and start a wash. The detergent drawer slides out, the program dial turns, the drum lights, water fills it, clothes tumble and the timer counts down.',
  keys: [
    { keys: ['o'], caps: ['O'], label: 'door', toggle: true },
    { keys: ['d'], caps: ['D'], label: 'drawer', toggle: true },
    { keys: ['l'], caps: ['L'], label: 'load' },
    { keys: [' '], caps: ['Space'], label: 'start / pause', toggle: true },
    { keys: ['1', '2', '3', '4'], caps: ['1–4'], label: 'program' },
  ],
  initial: {
    readout: 'COTTON 40° · 42:00',
    state: 'EMPTY · OPEN DOOR TO LOAD',
    pressed: { o: false, d: false, ' ': false },
  },
  viewBox: '-270.0133925012716 -270 495.8594894095369 505',
  progress: false,
} as const satisfies MiniatureMeta
