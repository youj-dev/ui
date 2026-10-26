import type { MiniatureMeta } from '../engine/types'

/** QUIRE MF–45, office printer: what a showroom shows before it mounts. */
export const officePrinter = {
  id: 'office-printer',
  name: 'Office printer',
  model: 'QUIRE MF–45',
  maker: 'QUIRE / OFFICE IMAGING',
  study: '046',
  spec: 'MF–45 / PRINT · COPY · SCAN · 45 PPM · A3',
  label: 'Office printer, QUIRE MF–45',
  description: 'A floor-standing multifunction printer and copier on casters: a document feeder over the scanner glass, a tilted touch panel, a center output tray, paper drawers and a side access door, with a waste bin beside it. Print a report and the pages feed out one by one and stack in the tray with a slight fan, each job offset from the last. Lift the lid and a light bar sweeps under the glass; copy the original lying on it. Pull a drawer out to see its ream. Every third report jams: the side door opens, the crumpled sheet goes in the bin and the panel returns to ready. As a progress indicator the pages follow the progress, and on completion the panel turns green.',
  keys: [
    { keys: ['p'], caps: ['P'], label: 'print' },
    { keys: ['c'], caps: ['C'], label: 'copy' },
    { keys: ['l'], caps: ['L'], label: 'lid' },
    { keys: ['1', '2', '3'], caps: ['1–3'], label: 'paper drawer' },
    { keys: ['d'], caps: ['D'], label: 'side door' },
  ],
  initial: { readout: 'READY · COUNTER 04816', state: 'READY · LID CLOSED', pressed: {} },
  viewBox: '-214.91789367798975 -365.45 383.93644095540424 557.45',
  progress: true,
} as const satisfies MiniatureMeta
