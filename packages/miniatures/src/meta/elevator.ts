import type { MiniatureMeta } from '../engine/types'

/** LEVARO T–5, elevator: what a showroom shows before it mounts. */
export const elevator = {
  id: 'elevator',
  name: 'Elevator',
  model: 'LEVARO T–5',
  maker: 'LEVARO / VERTICAL WORKS',
  study: '054',
  spec: 'T–5 / TRACTION · 5 STOPS · 630 KG · 1 M/S',
  label: 'Elevator, LEVARO T–5',
  description:
    'A traction elevator in a cutaway building section. The shaft is opened along one side: the cab, its walls lit, hangs from steel ropes over the traction sheave on the roof, and a yellow counterweight rides the other way. Each landing has center-opening brass doors, a dial over them whose needle counts the floors, a hall lantern and up and down call buttons. The number keys send the cab to a floor and the arrow keys press the next call button up or down, which stays lit until the cab comes, and it collects calls on its way. It speeds up and slows down smoothly, the dials sweep with it, and the doors slide open on arrival with a chime. O holds the doors and C closes them. Left alone it carries riders between floors. As a progress indicator the floors are the steps: the cab goes to the floor for the progress, and done takes it to the top.',
  keys: [
    { keys: ['1', '2', '3', '4', '5'], caps: ['1–5'], label: 'send to floor' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑ ↓'], label: 'call up / down' },
    { keys: ['o'], caps: ['O'], label: 'hold doors' },
    { keys: ['c'], caps: ['C'], label: 'close doors' },
  ],
  initial: { readout: '1 · IDLE', state: 'IDLE · DOORS CLOSED', pressed: {} },
  viewBox: '-47.569219381653056 -156.3 89.94228634059948 200.3',
  progress: true,
} as const satisfies MiniatureMeta
