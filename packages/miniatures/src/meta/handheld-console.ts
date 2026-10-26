import type { MiniatureMeta } from '../engine/types'

/** PALLO P–8, handheld game console: what a showroom shows before it mounts. */
export const handheldConsole = {
  id: 'handheld-console',
  name: 'Handheld game console',
  model: 'PALLO P–8',
  maker: 'PALLO / POCKET GAMES',
  study: '058',
  spec: 'P–8 / 8-BIT · AMBER BACKLIT LCD · ROM CARTRIDGE · MONO SPEAKER',
  label: 'Handheld game console, PALLO P–8',
  description:
    'A retro handheld game console leaning back on a small stand: a two-tone shell, an amber backlit screen in a dark bezel, a d-pad, A and B buttons, select and start, a speaker grille and a cartridge in its top edge. It plays Pip Hop, a little game of its own: walk Pip under the falling coins with the arrows, hop the blocks that roll in with A and dash with B, while the buttons press under your keys and the score shows in the readout. Start pauses, select switches the backlight, and E ejects the cartridge and pushes it back in, so the console boots again. Left alone, it plays a demo.',
  keys: [
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'walk' },
    { keys: ['a', ' ', 'ArrowUp'], caps: ['A', 'Space', '↑'], label: 'hop' },
    { keys: ['b'], caps: ['B'], label: 'dash' },
    { keys: ['ArrowDown'], caps: ['↓'], label: 'drop' },
    { keys: ['Enter'], caps: ['Enter'], label: 'start / pause' },
    { keys: ['s'], caps: ['S'], label: 'select · backlight' },
    { keys: ['e'], caps: ['E'], label: 'eject cartridge' },
  ],
  initial: { readout: 'SCORE 0000 · HI 0000 · ♥♥♥', state: 'PIP HOP · PRESS START', pressed: {} },
  viewBox: '-2.47 -122.76 192 194.26',
  progress: false,
} as const satisfies MiniatureMeta
