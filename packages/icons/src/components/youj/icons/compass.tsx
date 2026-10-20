import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The needle swings, overshoots north and finds it again, like a real compass damping out. */
export const CompassIcon = createIcon({
  name: 'compass',
  category: 'navigation',
  keywords: ['explore', 'discover', 'direction', 'browse', 'safari'],
  variants: (k) => ({
    needle: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: {
        rotate: [0, -150, 40, -18, 6, 0],
        transition: seq(k, 'deliberate', [0, 0.3, 0.55, 0.75, 0.9, 1]),
      },
    },
  }),
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <m.path d="M15.18 8.82 L13.59 13.59 L8.82 15.18 L10.41 10.41 Z" variants={v.needle} style={origin(12, 12)} />
    </>
  ),
})

