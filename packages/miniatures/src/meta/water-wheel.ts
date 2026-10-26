import type { MiniatureMeta } from '../engine/types'

/** OSSENFORD M–3, water wheel mill: what a showroom shows before it mounts. */
export const waterWheel = {
  id: 'water-wheel',
  name: 'Water wheel mill',
  model: 'OSSENFORD M–3',
  maker: 'OSSENFORD / MILLWRIGHTS',
  study: '090',
  spec: 'M–3 / OVERSHOT · 4 M WHEEL · 1:8 GEARING · ONE PAIR OF STONES',
  label: 'Water wheel mill, OSSENFORD M–3',
  description: 'A small cutaway mill: a wooden overshot wheel fed by a flume from a stone pier, its shaft running into the millhouse, where a pit wheel, a wallower and a great spur wheel turn a stone nut and the runner stone, and flour runs down the meal spout into a sack. Press Space, or click the sluice gate, to open or close it: water shoots from under the gate into the buckets, and the wheel gathers way under their weight; shut, it runs on until the buckets are empty, then coasts to rest. The up and down arrows set the flow. The gears turn at their ratios, the stone eight times for each turn of the wheel, and full sacks are set outside. As a progress indicator the four sacks of a batch fill with the progress; on completion the last sack is filled, the sluice shuts and the wheel comes to rest.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'sluice' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑ ↓'], label: 'flow' },
    { keys: ['p'], caps: ['P'], label: 'progress +25%' },
    { keys: ['Enter'], caps: ['Enter'], label: 'done' },
  ],
  initial: {
    readout: '5.9 RPM · STONE 47 RPM · 76 KG/H',
    state: 'MILLING · SLUICE 60% · SACK 2',
    pressed: {},
  },
  viewBox: '-69.75575286112627 -96 200.99930939094767 204',
  progress: true,
} as const satisfies MiniatureMeta
