import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The small figure dips below the line and bobs back up to its place beside the letter. */
export const SubscriptIcon = createIcon({
  name: 'subscript',
  category: 'editor',
  keywords: ['subscript', 'chemical formula', 'index', 'below', 'text format'],
  variants: (k) => ({
    figure: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1.5, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <path d="M4 6 L12 16" />
      <path d="M12 6 L4 16" />
      <m.path d="M16.25 15.5 C16.4 14.6 17.1 14 18 14 C18.97 14 19.75 14.7 19.75 15.6 C19.75 16.3 19.4 16.7 18.9 17.2 L16.25 20 H19.75" variants={v.figure} />
    </>
  ),
})
