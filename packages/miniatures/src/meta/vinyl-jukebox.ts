import type { MiniatureMeta } from '../engine/types'

/** CARILLON M–100, jukebox: what a showroom shows before it mounts. */
export const vinylJukebox = {
  id: 'vinyl-jukebox',
  name: 'Jukebox',
  model: 'CARILLON M–100',
  maker: 'CARILLON / AUTOMATIC MUSIC',
  study: '045',
  spec: 'M–100 / 10 RECORDS · 45 RPM · LIGHT PIPES',
  label: 'Jukebox, CARILLON M–100',
  description: 'An arched jukebox with color-cycling light pipes and bubble tubes. Behind the window ten records stand in a magazine; choosing one sends a gripper to lift it, flip it onto the turntable and lower the tone arm while the lights cycle with the beat.',
  keys: [
    { keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], caps: ['1–0'], label: 'pick a song' },
    { keys: [' '], caps: ['Space'], label: 'reject' },
    { keys: ['c'], caps: ['C'], label: 'coin' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'volume' },
  ],
  initial: { readout: 'SELECT 1–0', state: 'IDLE · VOL 6 · 3 CREDITS', pressed: {  } },
  viewBox: '-51.569219381653056 -152 127.38715006927039 224',
  progress: false,
} as const satisfies MiniatureMeta
