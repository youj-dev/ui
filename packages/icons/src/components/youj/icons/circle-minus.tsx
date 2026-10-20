import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* The bar pinches toward its own center by moving its ends, so its round caps
 * stay round all the way in (a scaleX would squash them). */
const BAR = 'M8.25 12 L15.75 12'
const PINCHED = 'M11.25 12 L12.75 12'

/** Remove. The bar draws in to its center and springs back out to full width; the ring holds still. */
export const CircleMinusIcon = createIcon({
  name: 'circle-minus',
  category: 'actions',
  keywords: ['minus-circle', 'remove', 'subtract', 'delete', 'decrease', 'less', 'collapse'],
  variants: (k) => ({
    bar: {
      rest: { d: BAR, transition: k.spring('snappy') },
      active: { d: [null, PINCHED, BAR], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <m.path d={BAR} variants={v.bar} />
    </>
  ),
})
