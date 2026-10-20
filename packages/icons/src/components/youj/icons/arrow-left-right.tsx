import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/* ⇄: the rightward arrow over the leftward one, staggered so each shaft
 * starts where the other's head is. Straight shafts and 90° heads, as on the
 * single arrows; the pair is symmetric under a half turn about the center. */

/**
 * Swap. The pair makes a half-turn about its center, each arrow taking the
 * other's lane, and lands on its own silhouette. Rest is 180° so leaving
 * mid-turn completes forwards.
 */
export const ArrowLeftRightIcon = createIcon({
  name: 'arrow-left-right',
  category: 'arrows',
  keywords: ['swap', 'exchange', 'switch', 'transfer', 'convert', 'trade'],
  variants: (k) => ({
    pair: {
      rest: { rotate: 180, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 180], transition: k.tween('deliberate', 'enter') },
    },
  }),
  render: (v) => (
    <m.g variants={v.pair} style={origin(12, 12)}>
      <path d="M8 8 H20" />
      <path d="M16 4 L20 8 L16 12" />
      <path d="M16 16 H4" />
      <path d="M8 12 L4 16 L8 20" />
    </m.g>
  ),
})
