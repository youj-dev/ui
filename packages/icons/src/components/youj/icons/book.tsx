import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The book is tipped off the shelf toward you and settles back upright. */
export const BookIcon = createIcon({
  name: 'book',
  category: 'files',
  keywords: ['read', 'library', 'guide', 'manual', 'documentation', 'ebook', 'learn'],
  variants: (k) => ({
    book: {
      rest: { rotate: 0, y: 0, transition: k.tween('base') },
      active: { rotate: [0, -8, 2, 0], y: [0, -1, 0, 0], transition: seq(k, 'deliberate', [0, 0.35, 0.7, 1], ['standard', 'emphasized', 'standard']) },
    },
  }),
  render: (v) => (
    <m.g variants={v.book} style={origin(5, 21)}>
      <path d="M5 19 V5 A2 2 0 0 1 7 3 H19 V17 H7 A2 2 0 0 0 5 19 A2 2 0 0 0 7 21 H19 V17" />
      <path d="M9 7.5 H15" />
    </m.g>
  ),
})
