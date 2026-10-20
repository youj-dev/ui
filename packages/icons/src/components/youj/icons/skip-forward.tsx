import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The triangle leaps into the bar; the bar takes the hit and the triangle re-enters. */
export const SkipForwardIcon = createIcon({
  name: 'skip-forward',
  category: 'media',
  keywords: ['next', 'track', 'forward', 'media', 'skip'],
  variants: (k) => ({
    tri: {
      rest: { x: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        x: [0, 5, -6, 0],
        opacity: [1, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.32, 0.33, 1], ['exit', 'linear', 'emphasized']),
      },
    },
    bar: {
      rest: { x: 0, scaleY: 1, transition: k.tween('fast') },
      active: { x: [0, 0, 1, 0], scaleY: [1, 1, 0.85, 1], transition: seq(k, 'deliberate', [0, 0.25, 0.36, 1], ['linear', 'exit', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M5 5.5 L15 12 L5 18.5 Z" variants={v.tri} />
      <m.path d="M19 5 V19" variants={v.bar} style={origin(19, 12)} />
    </>
  ),
})
