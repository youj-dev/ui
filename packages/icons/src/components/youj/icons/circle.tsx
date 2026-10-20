import { m } from 'motion/react'
import { createIcon, FULL_DRAW, origin, seq } from './icon-base'

/* The ring starts at twelve o'clock and runs clockwise, so a shortened ring
 * opens its gap just behind twelve. Turning the whole ring carries the gap
 * round: the circle is symmetric, so only the gap is seen to move. */
const RING = 'M12 3 A9 9 0 1 1 12 21 A9 9 0 1 1 12 3'

/**
 * The ring opens a small gap at twelve o'clock, the gap runs once round the
 * circle, and it closes where it started. Rest is a full turn, so leaving
 * mid-lap finishes the lap forwards.
 */
export const CircleIcon = createIcon({
  name: 'circle',
  category: 'editor',
  keywords: ['circle', 'shape', 'ring', 'round', 'ellipse', 'radio', 'status', 'todo', 'oval'],
  variants: (k) => ({
    ring: {
      rest: { pathLength: FULL_DRAW, rotate: 360, transition: { pathLength: k.tween('fast'), rotate: k.tween('base', 'enter') } },
      active: {
        pathLength: [null, 0.8, 0.8, FULL_DRAW],
        rotate: [0, 360],
        transition: {
          pathLength: seq(k, 'deliberate', [0, 0.22, 0.7, 1], ['standard', 'linear', 'emphasized']),
          rotate: k.tween('deliberate', 'emphasized'),
        },
      },
    },
  }),
  render: (v) => <m.path d={RING} variants={v.ring} style={origin(12, 12)} />,
})
