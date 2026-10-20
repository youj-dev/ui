import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Drops out through the bottom and slides back in from the top, landing precisely. */
export const ArrowDownIcon = createIcon({
  name: 'arrow-down',
  category: 'arrows',
  keywords: ['down', 'below', 'scroll', 'descend', 'latest', 'lower'],
  variants: (k) => ({
    arrow: {
      rest: { y: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        y: [null, 9, -9, 0],
        opacity: [null, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.36, 0.37, 1], ['exit', 'linear', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    <m.g variants={v.arrow}>
      <path d="M12 5 V19" />
      <path d="M6 13 L12 19 L18 13" />
    </m.g>
  ),
})
