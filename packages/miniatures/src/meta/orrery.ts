import type { MiniatureMeta } from '../engine/types'

/** FENWICK O–6, orrery: what a showroom shows before it mounts. */
export const orrery = {
  id: 'orrery',
  name: 'Orrery',
  model: 'FENWICK O–6',
  maker: 'FENWICK / SCIENTIFIC INSTRUMENTS',
  study: '042',
  spec: 'O–6 / 6 PLANETS · MOON · 1 TURN = 1 MONTH',
  label: 'Orrery, FENWICK O–6',
  description: 'A brass orrery on a square plinth. A side crank drives exposed gearing that turns six planet arms at their relative speeds, Earth carrying its Moon; a frosted lamp sun lights each planet\'s day side and a mechanical counter shows the date.',
  keys: [
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'crank' },
    { keys: [' '], caps: ['Space'], label: 'drive', toggle: true },
    { keys: ['l'], caps: ['L'], label: 'lamp', toggle: true },
    { keys: ['1'], caps: ['1'], label: '–' },
    { keys: ['6'], caps: ['6'], label: 'planet' },
    { keys: ['r'], caps: ['R'], label: 'today' },
  ],
  initial: {
    readout: '06 OCT 2026 · +0 D',
    state: 'LAMP OFF · CRANK 0.0 TURNS',
    pressed: { ' ': false, l: false },
  },
  viewBox: '-124.31535329954589 -152 248.63070659909178 292',
  progress: false,
} as const satisfies MiniatureMeta
