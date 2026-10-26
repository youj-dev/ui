import type { MiniatureMeta } from '../engine/types'

/** ESKER L–87, model train: what a showroom shows before it mounts. */
export const modelTrain = {
  id: 'model-train',
  name: 'Model train',
  model: 'ESKER L–87',
  maker: 'ESKER / SCALE RAILWAYS',
  study: '087',
  spec: 'L–87 / H0 1:87 · 16.5 MM GAUGE · TANK ENGINE · 12 V DC',
  label: 'Model train, ESKER L–87',
  description: 'A model railway on a wooden baseboard: a crimson tank engine and its crimson-and-cream coach loop a ballasted oval past a country station, a halt with its home signal and a level crossing whose barriers lower and lights flash as the train comes. It runs to a timetable, calling at each station in turn. Space departs it or stops it at the next station, the arrows open and close the throttle with smooth acceleration and braking, S sets the signal to danger so the train brakes and waits at it, and W blows the whistle. As a progress indicator the trip from one station to the next follows the progress, and on completion the train pulls in and the platform lamps turn green.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'depart / stop' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'throttle' },
    { keys: ['s'], caps: ['S'], label: 'signal' },
    { keys: ['w'], caps: ['W'], label: 'whistle' },
  ],
  initial: { readout: '0 KM/H · NEXT: BRAEMOSS', state: 'AT TARNLOW · DEPARTS IN 3 S', pressed: {} },
  viewBox: '-103.53074360871936 -20 246.0326303877385 169.5',
  progress: true,
} as const satisfies MiniatureMeta
