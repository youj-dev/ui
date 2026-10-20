import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Rubbing out: the eraser works back and forth along the line on its tip, each stroke a little shorter. */
export const EraserIcon = createIcon({
  name: 'eraser',
  category: 'editor',
  keywords: ['erase', 'eraser', 'clear', 'delete', 'remove', 'clean', 'rubber'],
  variants: (k) => ({
    eraser: {
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [null, -1.5, 1.25, -0.75, 0.4, 0], transition: seq(k, 'deliberate', [0, 0.18, 0.4, 0.6, 0.8, 1]) },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.eraser}>
        {/* Drawn upright with its tip below the band, then tipped over onto the line. */}
        <g transform="translate(-0.5 1.75) rotate(45 12 12)">
          <rect x="8.5" y="3" width="7" height="14" rx="2" />
          <path d="M8.5 12.5 H15.5" />
        </g>
      </m.g>
      <path d="M11 20.5 H21" />
    </>
  ),
})
