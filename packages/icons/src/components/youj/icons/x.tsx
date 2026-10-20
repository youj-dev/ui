import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Close. The cross turns a quarter on its center, tucking in as it goes, and lands on its own silhouette. */
export const XIcon = createIcon({
  name: 'x',
  category: 'actions',
  keywords: ['close', 'dismiss', 'cancel', 'clear', 'remove', 'exit', 'delete'],
  variants: (k) => ({
    cross: {
      rest: { rotate: 0, scale: 1, transition: k.spring('snappy') },
      active: { rotate: 90, scale: [null, 0.8, 1], transition: { rotate: k.spring('snappy'), scale: seq(k, 'base', [0, 0.5, 1], ['exit', 'emphasized']) } },
    },
  }),
  render: (v) => (
    <m.g variants={v.cross} style={origin(12, 12)}>
      <path d="M18 6 L6 18" />
      <path d="M6 6 L18 18" />
    </m.g>
  ),
})
