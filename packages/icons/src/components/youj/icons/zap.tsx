import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, origin, seq } from './icon-base'

/** A charge runs the length of the bolt as it is redrawn from the top, and the bolt kicks down with the strike. */
export const ZapIcon = createIcon({
  name: 'zap',
  category: 'system',
  keywords: ['lightning', 'bolt', 'fast', 'instant', 'power', 'energy', 'flash', 'automation'],
  variants: (k) => ({
    bolt: { from: hidden, rest: drawn(k), active: drawIn(k, 'slow', 0, 'emphasized') },
    strike: {
      rest: { y: 0, scale: 1, transition: k.tween('fast') },
      active: { y: [null, 1, 0], scale: [null, 0.94, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized'], k.duration('base')) },
    },
  }),
  render: (v) => (
    <m.g variants={v.strike} style={origin(12, 12)}>
      <m.path d="M13.5 2.5 L4.5 13.5 H11.5 L10.5 21.5 L19.5 10.5 H12.5 Z" variants={v.bolt} />
    </m.g>
  ),
})
