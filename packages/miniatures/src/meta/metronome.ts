import type { MiniatureMeta } from '../engine/types'

/** TALVEN P–04, metronome: what a showroom shows before it mounts. */
export const metronome = {
  id: 'metronome',
  name: 'Metronome',
  model: 'TALVEN P–04',
  maker: 'TALVEN / RHYTHM WORKS',
  study: '021',
  spec: 'P–04 / SPRING DRIVE · 40–208 BPM · BAR BELL',
  label: 'Metronome, TALVEN P–04',
  description: 'A pyramid case with a sliding-weight pendulum over a tempo scale, a winding key, a spring gauge, an escapement window and a bar bell, beside a practice pad with a beat ring light and two drumsticks. Start the pendulum, slide the weight to change the tempo, wind the spring and set the bar bell. Tap the practice pad: its ring light sweeps with each beat and flashes green on the beat or amber when early or late.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'start/stop', toggle: true },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'tempo' },
    { keys: ['w'], caps: ['W'], label: 'wind' },
    { keys: ['p'], caps: ['P'], label: 'tap' },
    { keys: ['b'], caps: ['B'], label: 'bell' },
  ],
  initial: { readout: '96 BPM · ANDANTE', state: 'RUNNING · 68% SPRING', pressed: { ' ': true } },
  viewBox: '-111.26279441628824 -216.5 312.59223082615813 406.5',
  progress: false,
} as const satisfies MiniatureMeta
