import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Back. The mirror of arrow-right: slips out to the left and slides back in from the right, landing precisely. */
export const ArrowLeftIcon = createIcon({
  name: 'arrow-left',
  category: 'arrows',
  keywords: ['back', 'previous', 'prev', 'return', 'left'],
  variants: (k) => ({
    arrow: {
      rest: { x: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        x: [null, -9, 9, 0],
        opacity: [null, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.36, 0.37, 1], ['exit', 'linear', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    <m.g variants={v.arrow}>
      <path d="M19 12 H5" />
      <path d="M11 6 L5 12 L11 18" />
    </m.g>
  ),
})
