import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* Ring, shank and stock on the center line; the arms are a half circle
 * hung from the stock's level, ending in barbed flukes. */
const SWING = [0, 0.2, 0.4, 0.6, 0.8, 1]

/**
 * Harbour, port, anchored. The anchor swings from its ring like a weight on a
 * line, each swing smaller than the last, and comes to rest hanging true.
 */
export const AnchorIcon = createIcon({
  name: 'anchor',
  category: 'location',
  keywords: ['anchor', 'harbor', 'harbour', 'port', 'marine', 'nautical', 'ship', 'dock', 'moor', 'sea'],
  variants: (k) => ({
    anchor: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [null, 11, -8, 5, -2, 0], transition: seq(k, 'deliberate', SWING) },
    },
  }),
  render: (v) => (
    <m.g variants={v.anchor} style={origin(12, 5)}>
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7 V20.5" />
      <path d="M8.5 10.25 H15.5" />
      <path d="M5 13.5 A7 7 0 0 0 19 13.5" />
      <path d="M3.25 15.25 L5 13.5 L6.75 15.25" />
      <path d="M17.25 15.25 L19 13.5 L20.75 15.25" />
    </m.g>
  ),
})
