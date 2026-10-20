import type { MiniatureMeta } from '../engine/types'

/** ORSEN A–06, robot arm: what a showroom shows before it mounts. */
export const robotArm = {
  id: 'robot-arm',
  name: 'Robot arm',
  model: 'ORSEN A–06',
  maker: 'ORSEN / MOTION SYSTEMS',
  study: '028',
  spec: 'A–06 / 6 AXIS · 3 KG PAYLOAD · 183 MM REACH',
  label: 'Robot arm, ORSEN A–06',
  description: 'An infeed conveyor with a photo-eye, the arm on its plinth with a stack light, and an out table with three parcel slots. Run a pick-and-place cycle: the conveyor indexes a parcel to the photo-eye, the arm picks it with its parallel gripper and sets it on the out table. Jog any joint, open the gripper, hold the feed or latch the emergency stop; lights on every joint follow the motion.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'cycle / pause', toggle: true },
    { keys: ['1', '2', '3', '4', '5', '6'], caps: ['1–6'], label: 'jog joint' },
    { keys: ['g'], caps: ['G'], label: 'gripper' },
    { keys: ['f'], caps: ['F'], label: 'feed', toggle: true },
    { keys: ['e'], caps: ['E'], label: 'e-stop', toggle: true },
  ],
  initial: {
    readout: '06 axes · 00 placed',
    state: 'SERVOS READY',
    pressed: { ' ': false, f: true, e: false },
  },
  viewBox: '-213.453792062852 -99 468.47680350735703 353',
  progress: false,
} as const satisfies MiniatureMeta
