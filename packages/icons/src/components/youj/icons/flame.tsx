import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* The outer flame is six cubics with two tips; its flicker poses move only
 * the tips and the waist, so the base stays put on the wick. */
const FLAME =
  'M12 21.5 C8.41 21.5 5.5 18.87 5.5 15.5 C5.5 11.5 9 9.5 9.5 5 C11.5 6.5 12.5 8.5 12.75 10.5 C13.5 9.5 14 8.25 14 7 C16.5 9 18.5 12 18.5 15.5 C18.5 18.87 15.59 21.5 12 21.5 Z'
const LEAN_LEFT =
  'M12 21.5 C8.41 21.5 5.5 18.87 5.5 15.5 C5.5 11.25 8.25 9.25 8.5 4.75 C10.75 6.5 12.25 8.5 12.5 10.25 C13 9.25 13.25 8 13.25 6.75 C16 9 18.5 12 18.5 15.5 C18.5 18.87 15.59 21.5 12 21.5 Z'
const LEAN_RIGHT =
  'M12 21.5 C8.41 21.5 5.5 18.87 5.5 15.5 C5.5 11.75 9.5 9.75 10.25 5.5 C12 7 12.75 8.75 13 10.75 C13.75 9.75 14.5 8.5 14.75 7.25 C17 9.25 18.5 12 18.5 15.5 C18.5 18.87 15.59 21.5 12 21.5 Z'

/** Burning bright: the flame licks left and right on its wick, its core flaring as it goes, and steadies. */
export const FlameIcon = createIcon({
  name: 'flame',
  category: 'weather',
  keywords: ['fire', 'hot', 'trending', 'streak', 'popular', 'burn', 'heat', 'energy'],
  variants: (k) => ({
    flame: {
      rest: { d: FLAME, transition: k.tween('base') },
      active: { d: [null, LEAN_LEFT, LEAN_RIGHT, FLAME], transition: seq(k, 'deliberate', [0, 0.3, 0.65, 1], ['standard', 'standard', 'emphasized']) },
    },
    core: {
      rest: { scale: 1, transition: k.tween('base') },
      active: { scale: [null, 1.15, 0.9, 1], transition: seq(k, 'deliberate', [0, 0.3, 0.65, 1], ['standard', 'standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d={FLAME} variants={v.flame} />
      <m.path d="M12 21.5 A3 3 0 0 1 9 18.5 C9 16.75 10.5 15.5 11.25 13.75 C13 15 15 16.5 15 18.5 A3 3 0 0 1 12 21.5 Z" variants={v.core} style={origin(12, 21.5)} />
    </>
  ),
})
