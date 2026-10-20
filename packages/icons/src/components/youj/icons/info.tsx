import { m } from 'motion/react'
import { createIcon, drawIn, drawn, seq } from './icon-base'

/** The stem is drawn upward, then the dot drops onto it. */
export const InfoIcon = createIcon({
  name: 'info',
  category: 'status',
  keywords: ['about', 'help', 'details', 'information', 'hint'],
  variants: (k) => ({
    stem: { rest: drawn(k), active: drawIn(k, 'slow') },
    dot: {
      rest: { y: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        y: [-5, -5, 0],
        opacity: [0, 0, 1],
        transition: seq(k, 'slow', [0, 0.4, 1], ['linear', 'emphasized'], k.stagger('loose')),
      },
    },
  }),
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <m.path d="M12 16 V11" variants={v.stem} />
      <m.path d="M12 8 h.01" variants={v.dot} />
    </>
  ),
})
