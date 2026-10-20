import { m } from 'motion/react'
import { createIcon } from './icon-base'

/**
 * Left ↔ center. The ragged lines slide over to the center axis one after
 * another; reversing sets them back against the left margin. The full-width
 * line never moves. `active` = centered.
 */
export const AlignLeftIcon = createIcon({
  name: 'align-left',
  category: 'editor',
  keywords: ['align', 'left', 'text', 'paragraph', 'justify', 'centre', 'center'],
  states: ['left', 'centre'],
  variants: (k) => {
    const s = k.stagger('base')
    return {
      middle: {
        rest: { x: 0, transition: { ...k.spring('snappy'), delay: s } },
        active: { x: 3, transition: k.spring('snappy') },
      },
      bottom: {
        rest: { x: 0, transition: k.spring('snappy') },
        active: { x: 2, transition: { ...k.spring('snappy'), delay: s } },
      },
    }
  },
  render: (v) => (
    <>
      <path d="M3 6 H21" />
      <m.path d="M3 12 H15" variants={v.middle} />
      <m.path d="M3 18 H17" variants={v.bottom} />
    </>
  ),
})
