import type { MiniatureMeta } from '../engine/types'

/** ARDEN & VOSS No. 5, letterpress: what a showroom shows before it mounts. */
export const letterpress = {
  id: 'letterpress',
  name: 'Letterpress',
  model: 'ARDEN & VOSS No. 5',
  maker: 'ARDEN & VOSS / PLATEN WORKS',
  study: '024',
  spec: 'No. 5 PLATEN / 5 × 8 IN CHASE · HAND-FED',
  label: 'Letterpress, ARDEN & VOSS No. 5',
  description: 'A cast-iron platen press with an ink disc, form rollers, a chase holding a line of metal type, a feed board and a delivery tray, beside an open type case drawer. Type to set a line, lock the form, ink it and pull prints.',
  keys: [
    {
      keys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'],
      caps: ['A–Z'],
      label: 'set',
    },
    { keys: ['Backspace'], caps: ['⌫'], label: 'remove' },
    { keys: ['Enter'], caps: ['⏎'], label: 'lock' },
    { keys: ['i'], caps: ['I'], label: 'ink' },
    { keys: ['p'], caps: ['P'], label: 'pull' },
    { keys: ['n'], caps: ['N'], label: 'sheet' },
  ],
  initial: { readout: 'SET 8 · INK LOW · 3 PRINTS', state: 'READY TO PULL', pressed: {} },
  viewBox: '-169.61662348876783 -185 469.1370575452014 374',
  progress: false,
} as const satisfies MiniatureMeta
