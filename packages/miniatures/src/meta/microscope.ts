import type { MiniatureMeta } from '../engine/types'

/** AVEL M–04, lab microscope: what a showroom shows before it mounts. */
export const microscope = {
  id: 'microscope',
  name: 'Lab microscope',
  model: 'AVEL M–04',
  maker: 'AVEL / OPTICAL INSTRUMENTS',
  study: '018',
  spec: 'M–04 / 4× · 10× · 40× / LED · 4 FILTERS',
  label: 'Lab microscope, AVEL M–04',
  description: 'A binocular microscope on a cast stand: a filter turret over the LED lamp, a condenser with iris lever, a dark mechanical stage that carries the slide sideways, coarse and fine focus, a three-objective nosepiece with color-coded rings and two angled eyepieces. The circular field shows the stained cells at the selected magnification, focus, position and filter.',
  keys: [
    { keys: ['1', '2', '3'], caps: ['1', '2', '3'], label: 'objective' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'focus' },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'stage' },
    { keys: ['f'], caps: ['F'], label: 'filter' },
    { keys: ['l'], caps: ['L'], label: 'light' },
  ],
  initial: { readout: '10× · 0.90 mm', state: 'IN FOCUS · LIGHT ON', pressed: {  } },
  viewBox: '-178.27687752661222 -260.5 510.2768775266122 469.5',
  progress: false,
} as const satisfies MiniatureMeta
