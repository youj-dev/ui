import type { MiniatureMeta } from '../engine/types'

/** KARVELL S–5, acoustic drum kit: what a showroom shows before it mounts. */
export const drumKit = {
  id: 'drum-kit',
  name: 'Acoustic drum kit',
  model: 'KARVELL S–5',
  maker: 'KARVELL / DRUM WORKS',
  study: '083',
  spec: 'S–5 / 22" KICK · 14" SNARE · 14" HATS · 18" CRASH · 20" RIDE',
  label: 'Acoustic drum kit, KARVELL S–5',
  description:
    'A lacquered drum kit on a round rug: a kick drum with the maker’s plate on its front head, a chrome snare, rack toms on the kick, a floor tom, a hi-hat on its pedal stand, crash and ride cymbals on their stands, and the stool. Press a key or click a drum to hit it: heads dip and ring, the kick pedal thumps, cymbals wobble on their felts and the hi-hat opens and closes. Space plays an original groove, the arrows set its tempo, and the readout shows the tempo and the last hit.',
  keys: [
    { keys: ['k'], caps: ['K'], label: 'kick' },
    { keys: ['s'], caps: ['S'], label: 'snare' },
    { keys: ['t', 'y', 'f'], caps: ['T', 'Y', 'F'], label: 'toms' },
    { keys: ['h', 'o'], caps: ['H', 'O'], label: 'hi-hat closed / open' },
    { keys: ['c', 'r'], caps: ['C', 'R'], label: 'crash / ride' },
    { keys: [' '], caps: ['Space'], label: 'groove' },
    { keys: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'], caps: ['↑', '↓', '←', '→'], label: 'tempo' },
  ],
  initial: { readout: '96 BPM · LAST HIT —', state: 'READY / SPACE PLAYS THE GROOVE', pressed: {} },
  viewBox: '-100.45600701512308 -180 235.55303018162368 226.2248',
  progress: false,
} as const satisfies MiniatureMeta
