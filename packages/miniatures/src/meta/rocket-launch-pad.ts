import type { MiniatureMeta } from '../engine/types'

/** LOFTRA LC–7, rocket launch pad: what a showroom shows before it mounts. */
export const rocketLaunchPad = {
  id: 'rocket-launch-pad',
  name: 'Rocket launch pad',
  model: 'LOFTRA LC–7',
  maker: 'LOFTRA / LAUNCH SYSTEMS',
  study: '086',
  spec: 'LC–7 / TWO-STAGE LAUNCHER · SWING-ARM TOWER · T–10 S COUNT',
  label: 'Rocket launch pad, LOFTRA LC–7',
  description:
    'A two-stage rocket on a mobile platform over a concrete pad, held by the two swing arms of a lattice service tower, with a flame trench through the pad, a countdown board, a water tower and the crawlerway it rolled out on. Launch and the board flips down from ten while the arms swing away and the deluge sprays; the engines ignite, steam and smoke billow out of the trench and the rocket climbs out of the frame on a long flame. A moment later a fresh rocket rolls back out to the pad. Abort the count and the arms swing back. As a progress indicator the count follows the progress, and on completion the rocket lifts off.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'launch' },
    { keys: ['Escape'], caps: ['Esc'], label: 'abort' },
    { keys: ['p'], caps: ['P'], label: 'progress +25%' },
    { keys: ['Enter'], caps: ['Enter'], label: 'done' },
  ],
  initial: { readout: 'T–10 · ALT 0 M · 0 KM/H', state: 'READY · SPACE TO LAUNCH', pressed: {} },
  viewBox: '-109.92304845413263 -238 233.70250336881628 308',
  progress: true,
} as const satisfies MiniatureMeta
