import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

const SWING = [0, 0.18, 0.36, 0.54, 0.72, 1]

/** The body swings from its crown; the clapper follows a beat late and swings wider. */
export const BellIcon = createIcon({
  name: 'bell',
  category: 'status',
  keywords: ['notification', 'alert', 'reminder', 'ring', 'alarm'],
  variants: (k) => ({
    body: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, 14, -11, 7, -3, 0], transition: seq(k, 'deliberate', SWING) },
    },
    clapper: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, 20, -16, 10, -4, 0], transition: seq(k, 'deliberate', SWING, undefined, k.stagger('loose')) },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M6 9.5 A6 6 0 0 1 18 9.5 V13.5 L20 16.5 H4 L6 13.5 Z" variants={v.body} style={origin(12, 3.5)} />
      <m.path d="M10 19.5 A2 2 0 0 0 14 19.5" variants={v.clapper} style={origin(12, 3.5)} />
    </>
  ),
})
