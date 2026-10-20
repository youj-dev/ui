import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, seq } from './icon-base'

/** Denied: the sign shakes its head, and the bar is struck through again. */
export const BanIcon = createIcon({
  name: 'ban',
  category: 'security',
  keywords: ['block', 'forbidden', 'prohibited', 'deny', 'disabled', 'restricted', 'blocked'],
  variants: (k) => ({
    sign: {
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [0, -1, 1, -0.75, 0.4, 0], transition: seq(k, 'deliberate', [0, 0.15, 0.35, 0.55, 0.75, 1]) },
    },
    bar: { from: hidden, rest: drawn(k), active: drawIn(k, 'base', 0, 'emphasized') },
  }),
  render: (v) => (
    <m.g variants={v.sign}>
      <circle cx="12" cy="12" r="9" />
      <m.path d="M5.64 5.64 L18.36 18.36" variants={v.bar} />
    </m.g>
  ),
})
