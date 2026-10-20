import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The letter leans further into its slant, the way type is set in italic, and comes back to rest. */
export const ItalicIcon = createIcon({
  name: 'italic',
  category: 'editor',
  keywords: ['italic', 'emphasis', 'slant', 'oblique', 'text', 'format'],
  variants: (k) => ({
    letter: {
      rest: { skewX: 0, transition: k.tween('fast') },
      active: { skewX: [null, -12, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <m.g variants={v.letter} style={origin(12, 12)}>
      <path d="M19 4 H10" />
      <path d="M14 20 H5" />
      <path d="M15 4 L9 20" />
    </m.g>
  ),
})
