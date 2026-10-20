import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Crowned: the crown is lifted, tips jauntily to one side and is set back down level on its band. */
export const CrownIcon = createIcon({
  name: 'crown',
  category: 'commerce',
  keywords: ['premium', 'pro', 'upgrade', 'vip', 'king', 'plan', 'subscription', 'owner'],
  variants: (k) => ({
    crown: {
      rest: { y: 0, rotate: 0, transition: k.tween('base') },
      active: {
        y: [null, -1.75, 0],
        rotate: [null, -8, 0],
        transition: seq(k, 'deliberate', [0, 0.4, 1], ['standard', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M3 7 L7.5 11 L12 4.5 L16.5 11 L21 7 L19 17 H5 Z" variants={v.crown} style={origin(12, 17)} />
      <path d="M5 20.5 H19" />
    </>
  ),
})
