import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* chevron-right's own chevron, doubled at a six-unit pitch: the rear apex
 * sits level with the lead's open ends. */
const REAR = 'M6 6 L12 12 L6 18'
const LEAD = 'M12 6 L18 12 L12 18'

/**
 * Last page, skip to the end. The lead chevron runs out to the edge and the
 * rear one winds up and catches it, closing the gap, before both glide home
 * together.
 */
export const ChevronsRightIcon = createIcon({
  name: 'chevrons-right',
  category: 'arrows',
  keywords: ['last', 'last page', 'end', 'skip', 'forward', 'fast forward', 'next', 'double chevron'],
  variants: (k) => ({
    lead: {
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [null, 2, 2, 0], transition: seq(k, 'deliberate', [0, 0.34, 0.62, 1], ['standard', 'linear', 'emphasized']) },
    },
    rear: {
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [null, 5, 5, 0], transition: seq(k, 'deliberate', [0, 0.44, 0.62, 1], ['emphasized', 'linear', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d={REAR} variants={v.rear} />
      <m.path d={LEAD} variants={v.lead} />
    </>
  ),
})
