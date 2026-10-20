import type { MiniatureMeta } from '../engine/types'

/** VERDA G–14, greenhouse: what a showroom shows before it mounts. */
export const greenhouse = {
  id: 'greenhouse',
  name: 'Greenhouse',
  model: 'VERDA G–14',
  maker: 'VERDA / GROWING SYSTEMS',
  study: '037',
  spec: 'G–14 / 5.7 × 2.9 M · 4 VENTS · 2 × 120 W LED',
  label: 'Greenhouse, VERDA G–14',
  description: 'A white-framed glasshouse with glazing bars, a crested ridge, gutters and a downpipe to a water butt. Inside, slatted benches hold seed trays, ferns, succulents, geraniums and herbs; tomatoes climb canes at the far end and a citrus stands by the door. Open the vents, mist, switch the grow lights and fan, and turn day to night while the plants grow.',
  keys: [
    { keys: ['v'], caps: ['V'], label: 'vents', toggle: true },
    { keys: ['m'], caps: ['M'], label: 'mist', toggle: true },
    { keys: ['l'], caps: ['L'], label: 'grow lights', toggle: true },
    { keys: ['f'], caps: ['F'], label: 'fan', toggle: true },
    { keys: ['n'], caps: ['N'], label: 'day / night', toggle: true },
  ],
  initial: {
    readout: '24.0 °C · 58 % RH · DAY',
    state: 'SEEDLINGS · ALL CLOSED',
    pressed: { v: false, m: false, l: false, f: false, n: false },
  },
  viewBox: '-102.93266739736605 -128.5 304.5922308261581 298',
  progress: false,
} as const satisfies MiniatureMeta
