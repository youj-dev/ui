import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, seq } from './icon-base'

/** The path is drawn down and round the corner, and the head arrives at its end as the line does. */
export const CornerDownRightIcon = createIcon({
  name: 'corner-down-right',
  category: 'arrows',
  keywords: ['indent', 'nested', 'reply', 'sub item', 'child', 'turn'],
  variants: (k) => ({
    line: { from: hidden, rest: drawn(k), active: drawIn(k, 'slow', 0, 'emphasized') },
    head: {
      from: { opacity: 0 },
      rest: { x: 0, opacity: 1, transition: k.tween('fast') },
      active: { x: [-3, -3, 0], opacity: [0, 0, 1], transition: seq(k, 'slow', [0, 0.45, 1], ['linear', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M4 4 V11 A4 4 0 0 0 8 15 H20" variants={v.line} />
      <m.path d="M15 10 L20 15 L15 20" variants={v.head} />
    </>
  ),
})
