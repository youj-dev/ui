import type { MiniatureMeta } from '../engine/types'

/** KESTREL STARLINE, pinball: what a showroom shows before it mounts. */
export const pinball = {
  id: 'pinball',
  name: 'Pinball',
  model: 'KESTREL STARLINE',
  maker: 'KESTREL / AMUSEMENT CO.',
  study: '041',
  spec: 'STARLINE / 3 BALLS · 3 BUMPERS · 1 RAMP · 6.5° PITCH',
  label: 'Pinball, KESTREL STARLINE',
  description: 'A pinball cabinet on four legs. Under the glass, a ball rolls on a tilted playfield; flippers, a spring plunger, lit pop bumpers, slingshots, drop-in lanes, stand-up targets and a clear ramp score points on the dot-matrix display in the backbox.',
  keys: [
    { keys: ['z', 'm'], caps: ['Z', 'M'], label: 'flippers' },
    { keys: [' '], caps: ['Space'], label: 'hold, release to launch' },
    { keys: ['n'], caps: ['N'], label: 'new game' },
    { keys: ['t'], caps: ['T'], label: 'nudge' },
  ],
  initial: { readout: '0 · BALL 1', state: 'PULL THE PLUNGER', pressed: {  } },
  viewBox: '-71.48780366869514 -195 207.92751262122317 310.5',
  progress: false,
} as const satisfies MiniatureMeta
