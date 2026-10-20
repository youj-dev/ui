import type { MiniatureMeta } from '../engine/types'

/** ARCTELLA 9, refrigerator: what a showroom shows before it mounts. */
export const retroFridge = {
  id: 'retro-fridge',
  name: 'Refrigerator',
  model: 'ARCTELLA 9',
  maker: 'ARCTELLA / HOME APPLIANCES',
  study: '063',
  spec: 'ARCTELLA 9 / 9 CU FT · FREEZER · 1956',
  label: 'Refrigerator, ARCTELLA 9',
  description: 'Rounded white enamel cabinet, freezer and fresh-food doors with chrome handles, a control band with a frost gauge and cold dial, and a magnet note. Open either door to flood the shelves with light. The compressor hums and cycles with the cold setting, frost builds in the freezer and melts on defrost, and the note on the door swings when it moves.',
  keys: [
    { keys: ['d'], caps: ['D'], label: 'door', toggle: true },
    { keys: ['f'], caps: ['F'], label: 'freezer', toggle: true },
    { keys: ['c'], caps: ['C'], label: 'cold' },
    { keys: ['t'], caps: ['T'], label: 'defrost' },
    { keys: ['n'], caps: ['N'], label: 'note' },
  ],
  initial: {
    readout: '4.0°C · FREEZER −18°C · COLD 3',
    state: 'IDLE · FROST 30%',
    pressed: { d: false, f: false },
  },
  viewBox: '-104.06664199358161 -244 213.32943640986986 365',
  progress: false,
} as const satisfies MiniatureMeta
