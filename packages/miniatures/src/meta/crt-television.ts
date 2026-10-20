import type { MiniatureMeta } from '../engine/types'

/** ORBITONE 23–C, television: what a showroom shows before it mounts. */
export const crtTelevision = {
  id: 'crt-television',
  name: 'Television',
  model: 'ORBITONE 23–C',
  maker: 'ORBITONE / TELEVISION',
  study: '062',
  spec: '23–C / 23" COLOR TUBE · VHF 2–13 · RABBIT EARS',
  label: 'Television, ORBITONE 23–C',
  description: 'A walnut cabinet on splayed legs with a curved picture tube, a channel dial, a volume knob, a speaker and a rabbit-ear antenna. A 1960s console television. Power on and a bright dot grows into the picture; click through channels of test card, news, a rocket launch, cartoons, a western and snow; turn the antenna to clear the picture.',
  keys: [
    { keys: ['o'], caps: ['O'], label: 'power' },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'channel' },
    { keys: ['a'], caps: ['A'], label: 'antenna' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'volume' },
  ],
  initial: { readout: 'CH 2 · TEST CARD · VOL 5', state: 'OFF · PRESS O', pressed: {  } },
  viewBox: '-113.32497224277931 -219.37009030080168 277.7454433088405 374.3700903008017',
  progress: false,
} as const satisfies MiniatureMeta
