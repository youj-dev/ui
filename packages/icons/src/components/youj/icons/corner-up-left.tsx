import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, seq } from './icon-base'

/** The path is drawn up and round to the left, and the head arrives at its end as the line does. */
export const CornerUpLeftIcon = createIcon({
  name: 'corner-up-left',
  category: 'arrows',
  keywords: ['back', 'return', 'reply', 'undo', 'previous', 'turn'],
  variants: (k) => ({
    line: { from: hidden, rest: drawn(k), active: drawIn(k, 'slow', 0, 'emphasized') },
    head: {
      from: { opacity: 0 },
      rest: { x: 0, opacity: 1, transition: k.tween('fast') },
      active: { x: [3, 3, 0], opacity: [0, 0, 1], transition: seq(k, 'slow', [0, 0.45, 1], ['linear', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M20 20 V13 A4 4 0 0 0 16 9 H4" variants={v.line} />
      <m.path d="M9 4 L4 9 L9 14" variants={v.head} />
    </>
  ),
})
