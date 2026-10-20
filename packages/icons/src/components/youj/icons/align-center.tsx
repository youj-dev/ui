import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The short lines drift out to opposite margins and snap back to the center axis, one after the other. */
export const AlignCenterIcon = createIcon({
  name: 'align-center',
  category: 'editor',
  keywords: ['align', 'centre', 'center', 'text', 'paragraph', 'middle'],
  variants: (k) => {
    const drift = (dx: number, delay: number) => ({
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [null, dx, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], delay) },
    })
    return { middle: drift(-3, 0), bottom: drift(2, k.stagger('loose')) }
  },
  render: (v) => (
    <>
      <path d="M3 6 H21" />
      <m.path d="M6 12 H18" variants={v.middle} />
      <m.path d="M5 18 H19" variants={v.bottom} />
    </>
  ),
})
