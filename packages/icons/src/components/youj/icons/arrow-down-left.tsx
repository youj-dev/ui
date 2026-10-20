import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The mirror of arrow-up-right: leaves along its own diagonal and slides back in from the opposite corner. */
export const ArrowDownLeftIcon = createIcon({
  name: 'arrow-down-left',
  category: 'arrows',
  keywords: ['diagonal', 'south west', 'return', 'import', 'incoming'],
  variants: (k) => ({
    arrow: {
      rest: { x: 0, y: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        x: [null, -7, 7, 0],
        y: [null, 7, -7, 0],
        opacity: [null, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.36, 0.37, 1], ['exit', 'linear', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    <m.g variants={v.arrow}>
      <path d="M17 7 L7 17" />
      <path d="M16 17 H7 V8" />
    </m.g>
  ),
})
