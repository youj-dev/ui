import type { MiniatureMeta } from '../engine/types'

/** VELA 9, portable typewriter: what a showroom shows before it mounts. */
export const typewriter = {
  id: 'typewriter',
  name: 'Portable typewriter',
  model: 'VELA 9',
  maker: 'VELA / SCRIVENERS',
  study: '075',
  spec: 'VELA 9 / PICA 10 · 42 TYPEBARS · TWO-COLOR RIBBON · CASE',
  label: 'Portable typewriter, VELA 9',
  description: 'Type on your keyboard: each key dips, its typebar swings up to the printing point, the ribbon lifts, the letter lands on the paper and the carriage steps one space. The bell rings six spaces before the margin. Return the carriage, switch the ribbon between black and red, or put the lid on. Left alone, it types its letter by itself.',
  keys: [
    { keys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'], caps: ['A–Z'], label: 'type' },
    { keys: ['Enter'], caps: ['Enter'], label: 'return' },
    { keys: ['Backspace'], caps: ['⌫'], label: 'back' },
    { keys: ['ArrowUp', 'ArrowDown'], caps: ['↑', '↓'], label: 'ribbon black · red' },
    { keys: ['Escape'], caps: ['Esc'], label: 'lid', toggle: true },
  ],
  initial: {
    readout: 'LINE 6 · COL 15 · BLACK',
    state: 'READY · TYPE ON YOUR KEYBOARD',
    pressed: { Escape: false },
  },
  viewBox: '-269.27172275046934 -113 414.7018127597639 256',
  progress: false,
} as const satisfies MiniatureMeta
