import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/**
 * A blow: the hammer draws back on its grip and strikes, dipping in scale
 * through the swing so the head never leaves the grid, then settles.
 */
export const HammerIcon = createIcon({
  name: 'hammer',
  category: 'development',
  keywords: ['build', 'tool', 'hammer', 'construct', 'fix', 'maintenance', 'make'],
  variants: (k) => ({
    swing: {
      rest: { rotate: 0, scale: 1, transition: k.tween('base') },
      active: {
        rotate: [null, -6, 9, 0],
        scale: [null, 0.9, 0.9, 1],
        transition: seq(k, 'deliberate', [0, 0.4, 0.6, 1], ['standard', 'exit', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    /* Drawn upright, head up, and laid on the 45° diagonal. */
    <g transform="rotate(45 12 12)">
      <m.g variants={v.swing} style={origin(12, 21)}>
        <rect x="7" y="4" width="10" height="4.5" rx="1.5" />
        <path d="M12 8.5 V21" />
      </m.g>
    </g>
  ),
})
