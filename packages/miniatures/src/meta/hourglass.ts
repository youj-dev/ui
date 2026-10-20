import type { MiniatureMeta } from '../engine/types'

/** VESPERA H–12, hourglass: what a showroom shows before it mounts. */
export const hourglass = {
  id: 'hourglass',
  name: 'Hourglass',
  model: 'VESPERA H–12',
  maker: 'VESPERA / TIMEKEEPERS',
  study: '091',
  spec: 'H–12 / 12 S GLASS · BRASS CRADLE · WALNUT CAPS',
  label: 'Hourglass, VESPERA H–12',
  description: 'Two glass bulbs bound by a brass collar between turned walnut caps and four brass columns, hung on a pivot between two brass posts on a walnut plinth with a turn counter. Sand streams through the neck, drains as a crater above and piles into a cone below. When the upper bulb runs empty the cradle turns the glass over and it runs again. As a progress indicator the sand level follows the progress, and on completion the glass makes a final pouring turn and glows.',
  keys: [
    { keys: ['f'], caps: ['F'], label: 'turn over' },
    { keys: ['p'], caps: ['P'], label: 'progress +25%' },
    { keys: ['i'], caps: ['I'], label: 'indeterminate', toggle: true },
    { keys: ['Enter'], caps: ['Enter'], label: 'done' },
  ],
  initial: { readout: 'TURN 1 · 6 S LEFT', state: 'INDETERMINATE · SAND RUNNING', pressed: { i: true } },
  viewBox: '-53.569219381653056 -141 141.77945491468364 232',
  progress: true,
} as const satisfies MiniatureMeta
