import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/* Three quarters of a turn around (13, 13), open on the right, with the head
 * at twelve o'clock pointing on round. The center sits right of the grid's so
 * the arc and its head balance in the box. */
const ARC = 'M18.66 18.66 A8 8 0 1 1 13 5'
const HEAD = 'M10.25 2.25 L13 5 L10.25 7.75'

/**
 * Rotate clockwise. The arrow runs one full turn round its own ring with a
 * hard ease-out. Rest is 360°, so leaving mid-turn finishes forwards.
 */
export const RotateCwIcon = createIcon({
  name: 'rotate-cw',
  category: 'actions',
  keywords: ['rotate', 'rotate right', 'clockwise', 'turn', 'redo', 'reload', 'rotate-cw', 'spin'],
  variants: (k) => ({
    arrow: {
      rest: { rotate: 360, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 360], transition: k.tween('deliberate', 'enter') },
    },
  }),
  render: (v) => (
    <m.g variants={v.arrow} style={origin(13, 13)}>
      <path d={ARC} />
      <path d={HEAD} />
    </m.g>
  ),
})
