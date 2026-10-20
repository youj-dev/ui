import { m } from 'motion/react'
import { createIcon, drawIn, drawn, seq } from './icon-base'

/** Text colour: the letter hops and the colour bar under it is ruled again from left to right. */
export const BaselineIcon = createIcon({
  name: 'baseline',
  category: 'editor',
  keywords: ['text color', 'font color', 'highlight', 'underline', 'typography', 'baseline'],
  variants: (k) => ({
    letter: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -1.25, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
    bar: { rest: drawn(k), active: drawIn(k, 'slow', k.stagger('loose'), 'standard') },
  }),
  render: (v) => (
    <>
      <m.g variants={v.letter}>
        <path d="M7 15.5 L12 4 L17 15.5" />
        <path d="M9 11 H15" />
      </m.g>
      <m.path d="M4 20 H20" variants={v.bar} />
    </>
  ),
})
