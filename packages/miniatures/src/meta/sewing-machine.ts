import type { MiniatureMeta } from '../engine/types'

/** VELUN N–12, sewing machine: what a showroom shows before it mounts. */
export const sewingMachine = {
  id: 'sewing-machine',
  name: 'Sewing machine',
  model: 'VELUN N–12',
  maker: 'VELUN / THREAD WORKS',
  study: '022',
  spec: 'N–12 / 3 STITCHES · 600 SPM MAX',
  label: 'Sewing machine, VELUN N–12',
  description: 'A sewing machine with a thread spool and bobbin winder on its top cover, a take-up lever and tension dial on the face plate, a lit start button, a stitch screen and speed slider, a stitch dial, a hand wheel, a work light, and a foot pedal on its cable. It sews straight, zigzag or stretch seams into a linen swatch.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'sew' },
    { keys: ['1', '2', '3'], caps: ['1–3'], label: 'stitch' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'speed' },
    { keys: ['l'], caps: ['L'], label: 'light' },
    { keys: ['w'], caps: ['W'], label: 'turn wheel' },
    { keys: ['f'], caps: ['F'], label: 'foot' },
  ],
  initial: {
    readout: 'Straight · 000 stitches · 0.0 mm',
    state: 'READY · 360 SPM · LIGHT ON',
    pressed: {  },
  },
  viewBox: '-115.53074360871936 -183 392.1422123213443 438',
  progress: false,
} as const satisfies MiniatureMeta
