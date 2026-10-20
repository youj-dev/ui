import type { MiniatureMeta } from '../engine/types'

/** NALVEN P–35, film projector: what a showroom shows before it mounts. */
export const filmProjector = {
  id: 'film-projector',
  name: 'Film projector',
  model: 'NALVEN P–35',
  maker: 'NALVEN / MOTION WORKS',
  study: '024',
  spec: 'P–35 / 35 MM · 24 FPS · 1 KW LAMP · OPTICAL SOUND',
  label: 'Film projector, NALVEN P–35',
  description: 'Feed and take-up reels on arms, a film path through sprockets, loops, the gate and a sound drum, a lamphouse with vents and a chimney, a long lens, a motor with belts, and a beam with drifting dust onto a screen. The reel plays by default: a countdown leader runs 5 to 1, then a train crosses a viaduct, until the end card, an automatic rewind and the next show. Run or stop the transport, switch the lamp, focus and frame the picture, rewind, or cue the countdown.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'run', toggle: true },
    { keys: ['l'], caps: ['L'], label: 'lamp', toggle: true },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'focus' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'framing' },
    { keys: ['r'], caps: ['R'], label: 'rewind' },
    { keys: ['c'], caps: ['C'], label: 'countdown' },
  ],
  initial: {
    readout: '24 fps · 0000 · SHARP',
    state: 'PROJECTING · COUNTDOWN 5',
    pressed: { ' ': true, l: true },
  },
  viewBox: '-236.63070659909178 -242 644.7344431475024 590',
  progress: false,
} as const satisfies MiniatureMeta
