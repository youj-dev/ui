import type { MiniatureMeta } from '../engine/types'

/** TIDEWELL A–90, planted aquarium: what a showroom shows before it mounts. */
export const aquarium = {
  id: 'aquarium',
  name: 'Planted aquarium',
  model: 'TIDEWELL A–90',
  maker: 'TIDEWELL / AQUATICS',
  study: '044',
  spec: 'A–90 / 90 × 40 × 45 CM · 150 L · LED 6500 K',
  label: 'Planted aquarium, TIDEWELL A–90',
  description: 'A 90 cm planted tank on a two-door cabinet: aqua soil, stem plants, a sword plant, driftwood and stones, a school of neon tetras and an angelfish. A heater holds the set temperature, an internal filter stirs the surface, an airstone bubbles and a suspended light bar switches between daylight and a blue moonlight.',
  keys: [
    { keys: ['f'], caps: ['F'], label: 'feed' },
    { keys: ['l'], caps: ['L'], label: 'night light', toggle: true },
    { keys: ['b'], caps: ['B'], label: 'air', toggle: true },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'heater' },
  ],
  initial: { readout: '25.0 °C · DAY', state: 'SET 25.0 °C · AIR ON', pressed: { l: false, b: true } },
  viewBox: '-48.1051177665153 -107.9 139.51150572225254 186.9',
  progress: false,
} as const satisfies MiniatureMeta
