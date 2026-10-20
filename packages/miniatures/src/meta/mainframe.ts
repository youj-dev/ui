import type { MiniatureMeta } from '../engine/types'

/** OSTRAN S/8, mainframe: what a showroom shows before it mounts. */
export const mainframe = {
  id: 'mainframe',
  name: 'Mainframe',
  model: 'OSTRAN S/8',
  maker: 'OSTRAN / DATA MACHINES',
  study: '033',
  spec: 'S/8 / 64K CORE · 2 × 9-TRACK TAPE · 600 CARDS/MIN · 1100 LINES/MIN',
  label: 'Mainframe, OSTRAN S/8',
  description: 'A central processor with a lamp console, toggle switches and push buttons between two tape drives with reels and vacuum columns behind glass, a card reader with a hopper in front and a line printer feeding fanfold paper. A 1960s computer room. Load the card deck and watch the cards feed through the reader, run the program so the console lamps race and the tape reels spin in bursts, print the listing onto green-bar paper, halt, inject a fault to light the check lamp, and reset.',
  keys: [
    { keys: ['l'], caps: ['L'], label: 'load cards' },
    { keys: [' '], caps: ['Space'], label: 'run / halt', toggle: true },
    { keys: ['p'], caps: ['P'], label: 'print' },
    { keys: ['f'], caps: ['F'], label: 'fault', toggle: true },
    { keys: ['r'], caps: ['R'], label: 'reset' },
    { keys: ['1', '2', '3', '4', '5', '6', '7', '8'], caps: ['1–8'], label: 'switches' },
  ],
  initial: {
    readout: 'SR 245 · CARDS 00/00 · LINES 000',
    state: 'READY · L TO LOAD CARDS',
    pressed: { ' ': false, f: false },
  },
  viewBox: '-136.70765814495917 -117 335.76914536239786 301',
  progress: false,
} as const satisfies MiniatureMeta
