import type { MiniatureMeta } from '../engine/types'

/** ORVET C–24, cartesian 3d printer: what a showroom shows before it mounts. */
export const threeDPrinter = {
  id: '3d-printer',
  name: 'Cartesian 3D printer',
  model: 'ORVET C–24',
  maker: 'ORVET / FORM WORKS',
  study: '024',
  spec: 'C–24 / XYZ · HEATED BED · PLA',
  label: 'Cartesian 3D printer, ORVET C–24',
  description: 'An open frame printer with twin lead screws, a traveling gantry, a fan cooled print head, a heated sliding bed, a filament spool and a screen with a dial. Print a small hollow vase, pause, home the axes, cool the bed or change speed.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'print / pause' },
    { keys: ['h'], caps: ['H'], label: 'home' },
    { keys: ['c'], caps: ['C'], label: 'cool' },
    { keys: ['d'], caps: ['D'], label: 'speed' },
    { keys: ['l'], caps: ['L'], label: 'light' },
  ],
  initial: { readout: '0% · 23°C', state: 'STANDBY · 100% SPEED', pressed: {} },
  viewBox: '-215.06148721743872 -267 456.1037365484106 541',
  progress: false,
} as const satisfies MiniatureMeta
