import { m } from 'motion/react'
import { createIcon, drawIn, drawn, seq } from './icon-base'

/** The sun sets behind the ridge and rises again as the ridge line redraws. */
export const ImageIcon = createIcon({
  name: 'image',
  category: 'media',
  keywords: ['photo', 'picture', 'gallery', 'media', 'landscape'],
  variants: (k) => ({
    sun: {
      rest: { y: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        y: [0, 4, 4, 0],
        opacity: [1, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.3, 0.45, 1], ['exit', 'linear', 'emphasized']),
      },
    },
    ridge: { rest: drawn(k), active: drawIn(k, 'slow', k.duration('base'), 'standard') },
  }),
  render: (v) => (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <m.circle cx="9" cy="9" r="1.5" variants={v.sun} />
      <m.path d="M5 21 L15.5 10.5 L21 16" variants={v.ridge} />
    </>
  ),
})
