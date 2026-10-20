import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** arrow-up-right turned a quarter counter-clockwise: leaves along its own diagonal and slides back in from the opposite corner. */
export const ArrowUpLeftIcon = createIcon({
  name: 'arrow-up-left',
  category: 'arrows',
  keywords: ['diagonal', 'north west', 'back', 'return', 'up', 'collapse', 'overview'],
  variants: (k) => ({
    arrow: {
      rest: { x: 0, y: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        x: [null, -7, 7, 0],
        y: [null, -7, 7, 0],
        opacity: [null, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.36, 0.37, 1], ['exit', 'linear', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    <m.g variants={v.arrow}>
      <path d="M17 17 L7 7" />
      <path d="M7 16 V7 H16" />
    </m.g>
  ),
})
