import type { MiniatureMeta } from '../engine/types'

/** OSTRA B–3, repair bench: what a showroom shows before it mounts. */
export const repairBench = {
  id: 'repair-bench',
  name: 'Repair bench',
  model: 'OSTRA B–3',
  maker: 'OSTRA / SERVICE WORKS',
  study: '093',
  spec: 'B–3 / 350 °C IRON · 4-AXIS DRIVER · 5× LAMP',
  label: 'Repair bench, OSTRA B–3',
  description: 'An opened device with its circuit board exposed under a magnifier lamp, a soldering station with an iron in a coil stand, an analog multimeter with probes on the board, a small robot arm driving screws, a tool chest, a pegboard with a service checklist and a rotating maintenance beacon. A repair cycle runs on its own: the meter inspects, the iron solders joints trailing smoke, the robot arm tightens the board screws and the device is tested, while the amber beacon turns. As a progress indicator the checklist steps light up with the progress; on completion the case closes and the beacon turns green.',
  keys: [
    { keys: ['p'], caps: ['P'], label: 'progress +25%' },
    { keys: ['i'], caps: ['I'], label: 'indeterminate', toggle: true },
    { keys: ['Enter'], caps: ['Enter'], label: 'done' },
    { keys: ['l'], caps: ['L'], label: 'lamp', toggle: true },
    { keys: ['d'], caps: ['D'], label: 'drawer', toggle: true },
  ],
  initial: {
    readout: 'CYCLE 01 · SOLDER · STEP 2/4',
    state: 'UNDER MAINTENANCE · INDETERMINATE',
    pressed: { i: true, l: true, d: false },
  },
  viewBox: '-80.74613391789285 -139 249.82685902179844 263',
  progress: true,
} as const satisfies MiniatureMeta
