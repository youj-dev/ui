import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Mirror of skip-forward: the triangle leaps back into the bar, the bar takes the hit, and the triangle re-enters from the right. */
export const SkipBackIcon = createIcon({
  name: 'skip-back',
  category: 'media',
  keywords: ['previous', 'back', 'track', 'restart', 'media', 'skip'],
  variants: (k) => ({
    tri: {
      rest: { x: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        x: [null, -5, 6, 0],
        opacity: [null, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.32, 0.33, 1], ['exit', 'linear', 'emphasized']),
      },
    },
    bar: {
      rest: { x: 0, scaleY: 1, transition: k.tween('fast') },
      active: { x: [null, 0, -1, 0], scaleY: [null, 1, 0.85, 1], transition: seq(k, 'deliberate', [0, 0.25, 0.36, 1], ['linear', 'exit', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M19 5.5 L9 12 L19 18.5 Z" variants={v.tri} />
      <m.path d="M5 5 V19" variants={v.bar} style={origin(5, 12)} />
    </>
  ),
})
