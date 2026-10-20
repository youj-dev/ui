import type { MiniatureMeta } from '../engine/types'

/** TAVREN T–02, two-slot toaster: what a showroom shows before it mounts. */
export const toaster = {
  id: 'toaster',
  name: 'Two-slot toaster',
  model: 'TAVREN T–02',
  maker: 'TAVREN / HEAT WORKS',
  study: '018',
  spec: 'T–02 / TWO SLOT · 850 W',
  label: 'Two-slot toaster, TAVREN T–02',
  description: 'Two bread slices in a rounded metal toaster. Lower the front lever to toast. Turn the browning dial, switch to inner-face bagel heating, cancel to pop the bread up, or pull the crumb tray.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'lever' },
    { keys: ['1', '2', '3', '4', '5', '6'], caps: ['1–6'], label: 'browning' },
    { keys: ['c'], caps: ['C'], label: 'cancel' },
    { keys: ['b'], caps: ['B'], label: 'bagel' },
    { keys: ['t'], caps: ['T'], label: 'tray' },
  ],
  initial: { readout: '03 / 06 · 00 s', state: 'READY / TWO SLICES', pressed: {  } },
  viewBox: '-165.28649646984564 -172 395.52489822352413 378',
  progress: false,
} as const satisfies MiniatureMeta
