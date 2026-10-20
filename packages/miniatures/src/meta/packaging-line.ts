import type { MiniatureMeta } from '../engine/types'

/** PLIÉ P–6, packaging line: what a showroom shows before it mounts. */
export const packagingLine = {
  id: 'packaging-line',
  name: 'Packaging line',
  model: 'PLIÉ P–6',
  maker: 'PLIÉ / PACKAGING SYSTEMS',
  study: '092',
  spec: 'P–6 / 6 STATIONS · 30 CARTONS/MIN · 12 TO A PALLET',
  label: 'Packaging line, PLIÉ P–6',
  description: 'A blank magazine, a carton erector, a can hopper, a flap folder, a tape head and a label print-and-apply unit along an indexing belt, with photo-eye sensors, a gantry palletiser stacking cartons on a pallet, a stretch-wrap mast and a control cabinet with a stack light. Flat blanks drop onto the belt and fold into cartons, cans fall in from the hopper, the flaps close, tape seals the seam and a lit printer stamps a label. A gantry stacks the cartons twelve to a pallet. As a progress indicator the pallet fills with the progress; on completion the pallet is wrapped and the light turns green.',
  keys: [
    { keys: ['p'], caps: ['P'], label: 'progress +25%' },
    { keys: ['i'], caps: ['I'], label: 'indeterminate', toggle: true },
    { keys: ['Enter'], caps: ['Enter'], label: 'done' },
    { keys: [' '], caps: ['Space'], label: 'stop / run', toggle: true },
  ],
  initial: {
    readout: 'PALLET 05/12 · 30 /MIN',
    state: 'RUNNING · INDETERMINATE',
    pressed: { i: true, ' ': false },
  },
  viewBox: '-120.58330249197702 -130 376.26656797432645 329',
  progress: true,
} as const satisfies MiniatureMeta
