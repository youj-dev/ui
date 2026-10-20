import type { MiniatureMeta } from '../engine/types'

/** TAVREN R–12, record turntable: what a showroom shows before it mounts. */
export const turntable = {
  id: 'turntable',
  name: 'Record turntable',
  model: 'TAVREN R–12',
  maker: 'TAVREN / ROTARY WORKS',
  study: '021',
  spec: 'R–12 / DIRECT DRIVE · 33⅓ 45 · ±8% · SIDE TIME ×14',
  label: 'Record turntable, TAVREN R–12',
  description: 'Walnut plinth, brushed aluminum deck, heavy platter with lamp-lit strobe dots, a twelve-inch record, a precision tonearm with counterweight, cue lift and headshell, and a smoked dust cover. Playing by default: the platter turns, the strobe dots stand still under the lamp and the arm tracks inward until it returns at the end of the side. Start and stop with inertia, change speed and pitch, cue the arm, open the cover, toggle repeat.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'start / stop', toggle: true },
    { keys: ['3', '4'], caps: ['3', '4'], label: '33 / 45' },
    { keys: ['c'], caps: ['C'], label: 'cue' },
    { keys: ['d'], caps: ['D'], label: 'cover', toggle: true },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'pitch' },
    { keys: ['0'], caps: ['0'], label: 'reset' },
    { keys: ['r'], caps: ['R'], label: 'repeat', toggle: true },
  ],
  initial: {
    readout: '33.3 rpm · A1 · 04:16',
    state: 'PLAYING · TRACK 1 · LOW SUN',
    pressed: { ' ': true, d: true, r: true },
  },
  viewBox: '-216.64994448555862 -247.99173909548466 609.9690713431427 528.9917390954847',
  progress: false,
} as const satisfies MiniatureMeta
