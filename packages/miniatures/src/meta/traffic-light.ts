import type { MiniatureMeta } from '../engine/types'

/** CORVEL TS–3, traffic light: what a showroom shows before it mounts. */
export const trafficLight = {
  id: 'traffic-light',
  name: 'Traffic light',
  model: 'CORVEL TS–3',
  maker: 'CORVEL / SIGNAL WORKS',
  study: '048',
  spec: 'TS–3 / 3 × 300 MM LED · CAP VISORS · PUSH BUTTON · COUNTDOWN',
  label: 'Traffic light, CORVEL TS–3',
  description: 'A street traffic signal on its pole: a yellow head with visored red, amber and green lamps on a black backplate, a pedestrian push-button box and a walk signal with a hand, a walking figure and a countdown, on a corner of sidewalk by a crosswalk. The lights cycle red, green, amber on a real controller’s timing. Press Space or the button box: WAIT lights, a green is cut short, and with the next red the walking figure shows while the countdown runs. R, A and G hold red, amber or green, as a blocked, pending or ready status; N flashes amber for the night; C resumes the cycle.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'push button' },
    { keys: ['r', 'a', 'g'], caps: ['R', 'A', 'G'], label: 'hold red · amber · green' },
    { keys: ['n'], caps: ['N'], label: 'night flash' },
    { keys: ['c'], caps: ['C'], label: 'resume cycle' },
  ],
  initial: { readout: 'RED · 4 S', state: 'BLOCKED · STOP', pressed: {} },
  viewBox: '-49.837168574084174 -210 104.87048957087498 252',
  progress: false,
} as const satisfies MiniatureMeta
