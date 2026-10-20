import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The bar pulls in from both ends and springs back out while the page settles under it. */
export const FileMinusIcon = createIcon({
  name: 'file-minus',
  category: 'files',
  keywords: ['remove from document', 'subtract', 'delete page', 'minus', 'less'],
  variants: (k) => ({
    page: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, 0.75, 0], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized']) },
    },
    bar: {
      rest: { scaleX: 1, transition: k.tween('fast') },
      active: { scaleX: [1, 0.3, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], k.stagger('base')) },
    },
  }),
  render: (v) => (
    <m.g variants={v.page} style={origin(12, 21)}>
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      <m.path d="M9 14.5 L15 14.5" variants={v.bar} style={origin(12, 14.5)} />
    </m.g>
  ),
})
