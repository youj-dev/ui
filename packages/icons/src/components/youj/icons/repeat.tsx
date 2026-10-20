import { m } from 'motion/react'
import { createIcon, after, drawIn, drawOut, origin } from './icon-base'

/* A stadium loop (ends on a 5 radius, runs at y 7 and 17) split into two
 * arrows. Each arrow rounds one end of the stadium and runs along a side to a
 * head that stops short of the far end, so the loop reads as flowing
 * clockwise. The pair is symmetric under a half turn about the center, and
 * the heads sit out at the ends of the runs to leave the middle for the 1. */
const TOP = 'M3.5 13 V12 A5 5 0 0 1 8.5 7 H18'
const TOP_HEAD = 'M15 4 L18 7 L15 10'
const BOTTOM = 'M20.5 11 V12 A5 5 0 0 1 15.5 17 H6'
const BOTTOM_HEAD = 'M9 20 L6 17 L9 14'

/**
 * Repeat ↔ repeat one. The loop turns a half-cycle, landing on its own
 * silhouette, and a 1 is written at its center; turning back erases it first.
 * `active` = repeat one.
 */
export const RepeatIcon = createIcon({
  name: 'repeat',
  category: 'arrows',
  keywords: ['loop', 'repeat one', 'replay', 'again', 'cycle', 'music'],
  states: ['repeat', 'repeat one'],
  variants: (k) => ({
    loop: {
      rest: { rotate: 0, transition: after(k, k.duration('instant'), 'slow', 'emphasized') },
      active: { rotate: 180, transition: k.tween('slow', 'emphasized') },
    },
    one: { rest: drawOut(k, 'fast'), active: drawIn(k, 'base', k.duration('base'), 'standard') },
  }),
  render: (v) => (
    <>
      <m.g variants={v.loop} style={origin(12, 12)}>
        <path d={TOP} />
        <path d={TOP_HEAD} />
        <path d={BOTTOM} />
        <path d={BOTTOM_HEAD} />
      </m.g>
      <m.path d="M10.5 10.5 L12 9.5 V14.5" variants={v.one} />
    </>
  ),
})
