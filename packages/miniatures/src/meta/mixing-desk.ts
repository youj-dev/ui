import type { MiniatureMeta } from '../engine/types'

/** MERRAN M–4, mixing desk: what a showroom shows before it mounts. */
export const mixingDesk = {
  id: 'mixing-desk',
  name: 'Mixing desk',
  model: 'MERRAN M–4',
  maker: 'MERRAN / CONSOLE WORKS',
  study: '031',
  spec: 'M–4 / 4 × MONO · STEREO BUS · 84 BPM',
  label: 'Mixing desk, MERRAN M–4',
  description: 'Sloped four-channel analog mixing desk with gain, EQ and pan knobs, mute and solo keys, long-throw faders and LED meters per channel, a master section with a stereo meter bridge, and two small studio monitors on stands behind it.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'play' },
    { keys: ['1'], caps: ['1'], label: '–' },
    { keys: ['4'], caps: ['4'], label: 'channel' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'fader' },
    { keys: ['m'], caps: ['M'], label: 'mute' },
    { keys: ['s'], caps: ['S'], label: 'solo' },
  ],
  initial: { readout: 'CH 1 · −4 dB · STOPPED', state: 'KICK · LIVE', pressed: {  } },
  viewBox: '-251.16660498395404 -199 590.6678011539208 507',
  progress: false,
} as const satisfies MiniatureMeta
