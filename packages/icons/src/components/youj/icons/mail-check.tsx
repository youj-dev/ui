import { m } from 'motion/react'
import { createIcon, drawIn, drawn, origin, seq } from './icon-base'

/** Delivered: the flap closes down once more and the check beside it is signed off. */
export const MailCheckIcon = createIcon({
  name: 'mail-check',
  category: 'communication',
  keywords: ['sent', 'delivered', 'read', 'email verified', 'mail done', 'confirmed'],
  variants: (k) => ({
    flap: {
      rest: { scaleY: 1, transition: k.tween('fast') },
      active: { scaleY: [1, 0, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    mark: { rest: drawn(k), active: drawIn(k, 'slow', k.duration('fast'), 'emphasized') },
  }),
  render: (v) => (
    <>
      <path d="M21 12.5 V7 A2 2 0 0 0 19 5 H5 A2 2 0 0 0 3 7 V17 A2 2 0 0 0 5 19 H12.5" />
      <m.path d="M3.5 7 L12 13 L20.5 7" variants={v.flap} style={origin(12, 7)} />
      <m.path d="M15 17.5 L17 19.5 L21 15.5" variants={v.mark} />
    </>
  ),
})
