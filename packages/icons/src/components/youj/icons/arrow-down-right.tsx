import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** arrow-up-right turned a quarter clockwise: leaves along its own diagonal and slides back in from the opposite corner. */
export const ArrowDownRightIcon = createIcon({
  name: 'arrow-down-right',
  category: 'arrows',
  keywords: ['diagonal', 'south east', 'decrease', 'decline', 'down', 'outgoing', 'trend'],
  variants: (k) => ({
    arrow: {
      rest: { x: 0, y: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        x: [null, 7, -7, 0],
        y: [null, 7, -7, 0],
        opacity: [null, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.36, 0.37, 1], ['exit', 'linear', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    <m.g variants={v.arrow}>
      <path d="M7 7 L17 17" />
      <path d="M17 8 V17 H8" />
    </m.g>
  ),
})
