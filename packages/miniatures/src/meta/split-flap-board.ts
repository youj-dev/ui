import type { MiniatureMeta } from '../engine/types'

/** PERRON F–11, split-flap board: what a showroom shows before it mounts. */
export const splitFlapBoard = {
  id: 'split-flap-board',
  name: 'Split-flap board',
  model: 'PERRON F–11',
  maker: 'PERRON / FLAP WORKS',
  study: '071',
  spec: 'F–11 / 2 × 11 FLAP MODULES · 43-FLAP DRUMS · 24 V',
  label: 'Split-flap board, PERRON F–11',
  description: 'A desk-sized departures board in a cream enamel housing: two rows of flap modules behind an aluminum bezel, a status color column, a drive knob, and an auto switch, home button and next button on top. Each top flap falls over the one below, clattering through its drum until every column settles on the next message: a status word, the local time, uptime, a deploy and what’s new. Flip ahead or back, run every drum home, or let it move on by itself.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'next' },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'back / next' },
    { keys: ['a'], caps: ['A'], label: 'auto', toggle: true },
    { keys: ['h'], caps: ['H'], label: 'home' },
  ],
  initial: { readout: 'STATUS · ALL CLEAR', state: 'SETTLED · NEXT IN 4 S', pressed: { a: true } },
  viewBox: '-46.64101615137754 -96 220.93417682058134 221.7',
  progress: false,
} as const satisfies MiniatureMeta
