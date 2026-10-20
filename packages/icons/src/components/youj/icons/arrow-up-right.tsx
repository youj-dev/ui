import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Leaves along its own diagonal and slides back in from the opposite corner. */
export const ArrowUpRightIcon = createIcon({
  name: 'arrow-up-right',
  category: 'arrows',
  keywords: ['external', 'open', 'link', 'launch'],
  variants: (k) => ({
    arrow: {
      rest: { x: 0, y: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        x: [0, 7, -7, 0],
        y: [0, -7, 7, 0],
        opacity: [1, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.36, 0.37, 1], ['exit', 'linear', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    <m.g variants={v.arrow}>
      <path d="M7 17 L17 7" />
      <path d="M8 7 H17 V16" />
    </m.g>
  ),
})
