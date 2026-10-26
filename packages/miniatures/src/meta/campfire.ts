import type { MiniatureMeta } from '../engine/types'

/** ASKELD T–2, campfire and tent: what a showroom shows before it mounts. */
export const campfire = {
  id: 'campfire',
  name: 'Campfire and tent',
  model: 'ASKELD T–2',
  maker: 'ASKELD / CAMP WORKS',
  study: '089',
  spec: 'T–2 / CANVAS RIDGE TENT · STONE FIRE RING · STORM LANTERN',
  label: 'Campfire and tent, ASKELD T–2',
  description:
    'A canvas ridge tent and a stone-ringed campfire on a patch of turf, with a log seat and a roasting stick. The fire crackles and sends sparks up, and burns down slowly to embers; Space adds a log, and it flares up, then settles. Click the tent to light or dim the storm lantern hanging in its door. Drag the stick to the fire, or press T, to toast the marshmallow from golden to burnt; M puts on a fresh one. At night the fire lights the camp and the stars come out.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'add a log' },
    { keys: ['l'], caps: ['L'], label: 'lantern' },
    { keys: ['t'], caps: ['T'], label: 'toast' },
    { keys: ['m'], caps: ['M'], label: 'fresh marshmallow' },
  ],
  initial: {
    readout: 'STEADY · 800 °C · FUEL 62%',
    state: 'MARSHMALLOW RAW · LANTERN ON',
    pressed: {},
  },
  viewBox: '-57 -72 127.11 115.14',
  progress: false,
} as const satisfies MiniatureMeta
