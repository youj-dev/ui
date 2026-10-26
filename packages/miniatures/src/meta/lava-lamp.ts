import type { MiniatureMeta } from '../engine/types'

/** MORVELLE L–14, lava lamp: what a showroom shows before it mounts. */
export const lavaLamp = {
  id: 'lava-lamp',
  name: 'Lava lamp',
  model: 'MORVELLE L–14',
  maker: 'MORVELLE / MOTION LAMPS',
  study: '082',
  spec: 'L–14 / 14½" GLASS GLOBE · 25 W BULB · WAX IN WATER',
  label: 'Lava lamp, MORVELLE L–14',
  description:
    'A tapered glass globe of wax and water between a brushed aluminum base and cap, standing on a cork coaster. Warm wax lifts off the pool on the bottom and rises in slow blobs that stretch, merge and split, then cools under the cap and sinks back. Space switches it on and off: the bulb lights at once, but the wax takes a while to warm, sluggish at first before it flows, and settles back to the bottom as it cools. The arrow keys step through the colors of the wax and the water, and a click on the glass, or Enter, nudges the flow.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'on / off' },
    { keys: ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'], caps: ['← ↑ ↓ →'], label: 'colors' },
    { keys: ['Enter'], caps: ['Enter'], label: 'nudge · or click the glass' },
  ],
  initial: { readout: '60 °C · DREAMY', state: 'FLOWING · RED IN YELLOW', pressed: {} },
  viewBox: '-54 -153 108 183',
  progress: false,
} as const satisfies MiniatureMeta
