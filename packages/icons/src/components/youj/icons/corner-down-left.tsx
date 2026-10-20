import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, seq } from './icon-base'

/** Enter. A carriage return: the stroke runs down and sweeps back to the start of the line, and the head is pushed out at its end. */
export const CornerDownLeftIcon = createIcon({
  name: 'corner-down-left',
  category: 'arrows',
  keywords: ['enter', 'return', 'submit', 'newline', 'confirm', 'keyboard'],
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
      <m.path d="M20 4 V11 A4 4 0 0 1 16 15 H4" variants={v.line} />
      <m.path d="M9 10 L4 15 L9 20" variants={v.head} />
    </>
  ),
})
