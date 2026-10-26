import type { MiniatureMeta } from '../engine/types'

/** LARKWELL CR–3, claw machine: what a showroom shows before it mounts. */
export const clawMachine = {
  id: 'claw-machine',
  name: 'Claw machine',
  model: 'LARKWELL CR–3',
  maker: 'LARKWELL / PRIZE MERCHANDISERS',
  study: '053',
  spec: 'CR–3 / THREE-PRONG CLAW · 15 S TIMER · ONE CREDIT A PLAY',
  label: 'Claw machine, LARKWELL CR–3',
  description:
    'An arcade claw machine: a glass case piled with plush toys, a gantry and a three-prong claw on a cable, a lit marquee, a joystick, a big drop button, a coin slot and a prize door. Steer the claw with the arrow keys or the pointer over the glass, then press Space or the button: it drops, closes, lifts and carries its catch home to the chute. Lined up well, it holds; off center, it may slip on the way; off target, it misses. A win tumbles down to the prize door while the marquee flashes. C adds a credit, P takes the prize, and left alone it plays itself.',
  keys: [
    { keys: ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'], caps: ['←', '→', '↑', '↓'], label: 'steer the claw' },
    { keys: [' '], caps: ['Space'], label: 'drop' },
    { keys: ['c'], caps: ['C'], label: 'coin' },
    { keys: ['p'], caps: ['P'], label: 'take the prize' },
  ],
  initial: { readout: 'CREDITS 3 · TIMER 15 · WON 0', state: 'READY · STEER, THEN SPACE DROPS', pressed: {} },
  viewBox: '-85.01408311032397 -192 170.02816622064793 283',
  progress: false,
} as const satisfies MiniatureMeta
