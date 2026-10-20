import { m } from 'motion/react'
import { createIcon } from './icon-base'

const B = 'M6.5 12 H13.5 A4 4 0 0 1 13.5 20 H6.5 V4 H12.5 A4 4 0 0 1 12.5 12'

/**
 * Regular ↔ bold. The letter is struck twice and the two passes slide half a
 * stroke apart, so every stem thickens the way a faux-bold is set; turning
 * bold off slides them back together. `active` = bold.
 */
export const BoldIcon = createIcon({
  name: 'bold',
  category: 'editor',
  keywords: ['bold', 'strong', 'weight', 'text', 'format', 'typography'],
  states: ['regular', 'bold'],
  variants: (k) => ({
    left: {
      rest: { x: 0, transition: k.spring('snappy') },
      active: { x: -0.5, transition: k.spring('snappy') },
    },
    right: {
      rest: { x: 0, transition: k.spring('snappy') },
      active: { x: 0.5, transition: k.spring('snappy') },
    },
  }),
  render: (v) => (
    <>
      <m.path d={B} variants={v.left} />
      <m.path d={B} variants={v.right} />
    </>
  ),
})
