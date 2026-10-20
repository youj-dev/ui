import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, origin, seq } from './icon-base'

/** The center pops, then the tail is written around it in one continuous stroke. */
export const AtSignIcon = createIcon({
  name: 'at-sign',
  category: 'communication',
  keywords: ['email', 'mention', 'handle', 'address', 'username'],
  variants: (k) => ({
    ring: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0.6, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    tail: { from: hidden, rest: drawn(k), active: drawIn(k, 'deliberate', k.duration('fast')) },
  }),
  render: (v) => (
    <>
      <m.circle cx="12" cy="12" r="3.5" variants={v.ring} style={origin(12, 12)} />
      <m.path d="M15.5 8.5 V13 A2.75 2.75 0 0 0 21 13 V12 A9 9 0 1 0 17.5 19.1" variants={v.tail} />
    </>
  ),
})
