import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Nudges out to the right and re-enters from the left, landing precisely. */
export const ArrowRightIcon = createIcon({
  name: 'arrow-right',
  category: 'arrows',
  keywords: ['next', 'forward', 'continue', 'go'],
  variants: (k) => ({
    arrow: {
      rest: { x: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        x: [0, 9, -9, 0],
        opacity: [1, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.36, 0.37, 1], ['exit', 'linear', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    <m.g variants={v.arrow}>
      <path d="M5 12 H19" />
      <path d="M13 6 L19 12 L13 18" />
    </m.g>
  ),
})
