import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/* rotate-cw mirrored: three quarters of a turn around (11, 13), open on the
 * left, with the head at twelve o'clock pointing back. */
const ARC = 'M5.34 18.66 A8 8 0 1 0 11 5'
const HEAD = 'M13.75 2.25 L11 5 L13.75 7.75'

/**
 * Rotate counter-clockwise. The arrow runs one full turn back round its own
 * ring with a hard ease-out. Rest is −360°, so leaving mid-turn finishes the
 * turn instead of unwinding it.
 */
export const RotateCcwIcon = createIcon({
  name: 'rotate-ccw',
  category: 'actions',
  keywords: ['rotate', 'rotate left', 'counter-clockwise', 'anticlockwise', 'turn', 'undo', 'reset', 'rotate-ccw'],
  variants: (k) => ({
    arrow: {
      rest: { rotate: -360, transition: k.tween('base', 'enter') },
      active: { rotate: [0, -360], transition: k.tween('deliberate', 'enter') },
    },
  }),
  render: (v) => (
    <m.g variants={v.arrow} style={origin(11, 13)}>
      <path d={ARC} />
      <path d={HEAD} />
    </m.g>
  ),
})
