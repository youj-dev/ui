import type { MiniatureMeta } from '../engine/types'

/** BRANTOK E–35, excavator: what a showroom shows before it mounts. */
export const excavator = {
  id: 'excavator',
  name: 'Excavator',
  model: 'BRANTOK E–35',
  maker: 'BRANTOK / EARTHWORKS',
  study: '049',
  spec: 'E–35 / COMPACT TRACKED · ZERO TAIL SWING · 3.5 T',
  label: 'Excavator, BRANTOK E–35',
  description:
    'A compact tracked excavator with a dozer blade, a turning house with a glazed cab and a beacon, and a hydraulic boom, stick and bucket, between a trench it digs and a spoil pile. A dig cycle bites into the trench, scoops, lifts, swings the cab round and dumps on the pile: the trench deepens as the pile grows. Work the boom, stick and swing by hand, curl the bucket to scoop or dump, or sound the horn. Left alone it keeps digging, and backfills the trench when the pile is full. As a progress indicator the pile follows the progress, and on completion it parks.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'dig cycle' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'boom' },
    { keys: ['w', 's'], caps: ['W', 'S'], label: 'stick' },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'swing' },
    { keys: ['c'], caps: ['C'], label: 'curl / dump' },
    { keys: ['h'], caps: ['H'], label: 'horn' },
    { keys: ['p'], caps: ['P'], label: 'progress +25%' },
    { keys: ['Enter'], caps: ['Enter'], label: 'done' },
  ],
  initial: { readout: 'CYCLE 00 · LOAD 0.00 M³', state: 'READY · SPACE TO DIG', pressed: {} },
  viewBox: '-87.40638795573723 -84 186.07110616067217 144.5',
  progress: true,
} as const satisfies MiniatureMeta
