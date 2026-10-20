import type { MiniatureMeta } from '../engine/types'

/** ORLUN F–08, instant camera: what a showroom shows before it mounts. */
export const instantCamera = {
  id: 'instant-camera',
  name: 'Instant camera',
  model: 'ORLUN F–08',
  maker: 'ORLUN / OPTICAL WORKS',
  study: '018',
  spec: 'F–08 / 60–90 MM · INTEGRAL FILM',
  label: 'Instant camera, ORLUN F–08',
  description: 'An instant camera with a chrome top plate, leatherette body, telescoping lens with a knurled focus ring, flash with charge lamp, viewfinder, light meter, self-timer lamp, wrist strap and a hinged film door; prints feed out of the front slot and develop.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'shutter' },
    { keys: ['t'], caps: ['T'], label: 'self-timer' },
    { keys: ['f'], caps: ['F'], label: 'flash' },
    { keys: ['z'], caps: ['Z'], label: 'focus' },
    { keys: ['d'], caps: ['D'], label: 'film door' },
    { keys: ['p'], caps: ['P'], label: 'collect print · or click it' },
  ],
  initial: { readout: '60 mm · 08 left', state: 'FLASH ON · READY', pressed: {  } },
  viewBox: '-192.33905535310328 -147 383.81208530242213 350.1',
  progress: false,
} as const satisfies MiniatureMeta
