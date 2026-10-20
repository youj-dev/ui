import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/**
 * Time rewinds: the arrow winds back around the dial while the minute hand
 * spins a full turn counter-clockwise and the hour hand steps back an hour.
 */
export const HistoryIcon = createIcon({
  name: 'history',
  category: 'time',
  keywords: ['recent', 'past', 'undo', 'revisions', 'log', 'timeline', 'rewind'],
  variants: (k) => ({
    ring: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, -30, 0], transition: seq(k, 'deliberate', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
    minute: {
      rest: { rotate: -360, transition: k.tween('base', 'enter') },
      active: { rotate: [0, -360], transition: k.tween('deliberate', 'emphasized') },
    },
    hour: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, -30], transition: k.tween('deliberate', 'emphasized') },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.ring} style={origin(12, 12)}>
        <path d="M3.5 12 A8.5 8.5 0 1 0 5.99 5.99 L3.5 8.5" />
        <path d="M3.5 3.5 V8.5 H8.5" />
      </m.g>
      <m.path d="M12 12 L15 13.75" variants={v.hour} style={origin(12, 12)} />
      <m.path d="M12 12 V7.5" variants={v.minute} style={origin(12, 12)} />
    </>
  ),
})
