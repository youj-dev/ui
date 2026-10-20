import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/** On sale: the rosette turns an eighth and lands on its own outline while the percent holds still. Rest is 45° so leaving mid-turn completes forwards. */
export const BadgePercentIcon = createIcon({
  name: 'badge-percent',
  category: 'commerce',
  keywords: ['discount', 'sale', 'promo', 'offer', 'deal', 'coupon'],
  variants: (k) => ({
    rosette: {
      rest: { rotate: 45, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 45], transition: k.tween('deliberate', 'emphasized') },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M14.76 5.35 A3 3 0 0 1 18.65 9.24 A3 3 0 0 1 18.65 14.76 A3 3 0 0 1 14.76 18.65 A3 3 0 0 1 9.24 18.65 A3 3 0 0 1 5.35 14.76 A3 3 0 0 1 5.35 9.24 A3 3 0 0 1 9.24 5.35 A3 3 0 0 1 14.76 5.35 Z" variants={v.rosette} style={origin(12, 12)} />
      <path d="M9.5 14.5 L14.5 9.5" />
      <path d="M9.5 9.75 h.01" strokeWidth={2} />
      <path d="M14.5 14.25 h.01" strokeWidth={2} />
    </>
  ),
})
