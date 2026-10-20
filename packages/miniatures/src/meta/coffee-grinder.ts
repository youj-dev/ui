import type { MiniatureMeta } from '../engine/types'

/** VORLEN B–18, coffee grinder: what a showroom shows before it mounts. */
export const coffeeGrinder = {
  id: 'coffee-grinder',
  name: 'Coffee grinder',
  model: 'VORLEN B–18',
  maker: 'VORLEN / PARTICLE WORKS',
  study: '018',
  spec: 'B–18 / 58 MM FLAT BURRS · 220 G · CUP LIGHT',
  label: 'Coffee grinder, VORLEN B–18',
  description: 'A glass bean hopper feeds flat burrs under a rotating grind collar. The front plate carries a grind dial, a lit dose display and a dose button; a steel chute with a cup light drops the grounds into a glass catch cup on a grilled tray.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'grind' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'size' },
    { keys: ['d'], caps: ['D'], label: 'dose' },
  ],
  initial: { readout: '05 / 12 · 0.0 g', state: 'READY · 18 G DOSE', pressed: {  } },
  viewBox: '-147.09996299037243 -252.5 273.41531628991834 422.5',
  progress: false,
} as const satisfies MiniatureMeta
