import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The tag swings on its hole like a price tag hanging from a string, damping out to rest. */
export const TagIcon = createIcon({
  name: 'tag',
  category: 'commerce',
  keywords: ['price', 'label', 'sale', 'discount', 'coupon', 'category'],
  variants: (k) => ({
    tag: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, 9, -6, 3.5, -1.5, 0], transition: seq(k, 'deliberate', [0, 0.18, 0.4, 0.62, 0.82, 1]) },
    },
  }),
  render: (v) => (
    <m.g variants={v.tag} style={origin(7.5, 7.5)}>
      <path d="M5 3 H9.34 A2 2 0 0 1 12.17 4.17 L19.59 11.59 A2 2 0 0 1 19.59 14.41 L14.41 19.59 A2 2 0 0 1 11.59 19.59 L4.17 12.17 A2 2 0 0 1 3 9.34 V5 A2 2 0 0 1 5 3 Z" />
      <circle cx="7.5" cy="7.5" r="1" />
    </m.g>
  ),
})
