import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The bar pulls in from both ends and springs back out while the box gives under the press. */
export const SquareMinusIcon = createIcon({
  name: 'square-minus',
  category: 'actions',
  keywords: ['remove', 'subtract', 'collapse', 'minus box', 'decrease'],
  variants: (k) => ({
    box: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0.92, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    bar: {
      rest: { scaleX: 1, transition: k.tween('fast') },
      active: { scaleX: [1, 0.3, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], k.stagger('base')) },
    },
  }),
  render: (v) => (
    <m.g variants={v.box} style={origin(12, 12)}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <m.path d="M8.5 12 L15.5 12" variants={v.bar} style={origin(12, 12)} />
    </m.g>
  ),
})
