import type { MiniatureMeta } from '../engine/types'

/** KARREG POINT, lighthouse: what a showroom shows before it mounts. */
export const lighthouse = {
  id: 'lighthouse',
  name: 'Lighthouse',
  model: 'KARREG POINT',
  maker: 'KARREG / COASTAL LIGHTS',
  study: '039',
  spec: 'KP–1 / FL W 10 S · 34 M · RANGE 18 NM',
  label: 'Lighthouse, KARREG POINT',
  description: 'A tall banded tower with a gallery and a glazed lantern, a keeper\'s cottage, a fog-signal hut, a jetty with a boat and a granite island in the surf. A tapered masonry tower with two red bands rises from a granite island. Its lantern holds a rotating Fresnel lens that sweeps two beams across the sea. A keeper\'s cottage with a smoking chimney, a fog-signal hut with twin trumpets and a fog detector, a jetty and a moored boat sit around it. Switch the lamp, sound the horn, bring in fog and turn day to night.',
  keys: [
    { keys: ['l'], caps: ['L'], label: 'lamp', toggle: true },
    { keys: [' '], caps: ['Space'], label: 'fog horn' },
    { keys: ['f'], caps: ['F'], label: 'fog', toggle: true },
    { keys: ['d'], caps: ['D'], label: 'day / night', toggle: true },
  ],
  initial: {
    readout: 'DAY · LAMP OFF · CLEAR',
    state: 'BEAM 045° · VIS 24 NM',
    pressed: { l: false, f: false, d: false },
  },
  viewBox: '-123.75347625652859 -247.5 223.66347550275316 329.45304451331333',
  progress: false,
} as const satisfies MiniatureMeta
