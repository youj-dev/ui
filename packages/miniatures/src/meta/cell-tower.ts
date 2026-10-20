import type { MiniatureMeta } from '../engine/types'

/** VEKTA M–3, cell tower: what a showroom shows before it mounts. */
export const cellTower = {
  id: 'cell-tower',
  name: 'Cell tower',
  model: 'VEKTA M–3',
  maker: 'VEKTA / RADIO NETWORKS',
  study: '035',
  spec: 'M–3 / 3 × 120° SECTORS · 4T4R · 42 M LATTICE',
  label: 'Cell tower, VEKTA M–3',
  description: 'A tall tapered four-leg lattice tower with three antenna sectors and their radios, a cable ladder, a microwave link and aviation lights, over a fenced compound with an equipment cabinet, batteries and an ice bridge, a road with a car, and the three sector coverage areas painted on the ground. Raise or lower the traffic and the coverage rings, phones and radio lamps follow. Pick a sector, drive the car across the road to hand it over from one sector to the next, or cut the power: every sector drops, the cabinet raises its alarm and the radios come back one by one.',
  keys: [
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑ ↓'], label: 'traffic' },
    { keys: ['h'], caps: ['H'], label: 'handover' },
    { keys: ['o'], caps: ['O'], label: 'outage', toggle: true },
    { keys: ['1', '2', '3'], caps: ['1–3'], label: 'sector' },
  ],
  initial: {
    readout: 'LOAD 40% · 48 USERS · SECTOR A',
    state: 'ALL SECTORS UP · CAR ON B',
    pressed: { o: false },
  },
  viewBox: '-141.9038105676658 -166 283.8076211353316 333',
  progress: false,
} as const satisfies MiniatureMeta
