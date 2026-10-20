import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The short lines slip away from the right margin and snap back flush, one after the other. The full-width line never moves. */
export const AlignRightIcon = createIcon({
  name: 'align-right',
  category: 'editor',
  keywords: ['align', 'right', 'text', 'paragraph', 'flush right', 'text-align-end', 'end'],
  variants: (k) => {
    const slip = (dx: number, delay: number) => ({
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [null, dx, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], delay) },
    })
    return { middle: slip(-3, 0), bottom: slip(-2, k.stagger('loose')) }
  },
  render: (v) => (
    <>
      <path d="M3 6 H21" />
      <m.path d="M9 12 H21" variants={v.middle} />
      <m.path d="M7 18 H21" variants={v.bottom} />
    </>
  ),
})
