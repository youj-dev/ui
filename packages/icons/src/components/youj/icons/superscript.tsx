import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The small figure lifts above the line and settles back to its place beside the letter. */
export const SuperscriptIcon = createIcon({
  name: 'superscript',
  category: 'editor',
  keywords: ['superscript', 'exponent', 'power', 'footnote', 'above', 'text format'],
  variants: (k) => ({
    figure: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -1.5, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <path d="M4 8 L12 18" />
      <path d="M12 8 L4 18" />
      <m.path d="M16.25 4.5 C16.4 3.6 17.1 3 18 3 C18.97 3 19.75 3.7 19.75 4.6 C19.75 5.3 19.4 5.7 18.9 6.2 L16.25 9 H19.75" variants={v.figure} />
    </>
  ),
})
