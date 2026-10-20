import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, seq } from './icon-base'

/** A price cut: the slash slices through corner to corner and knocks the two rings apart, then they drift back together. */
export const PercentIcon = createIcon({
  name: 'percent',
  category: 'commerce',
  keywords: ['discount', 'sale', 'promo', 'coupon', 'rate', 'tax', 'off'],
  variants: (k) => {
    const kick = (dir: 1 | -1) => ({
      rest: { x: 0, y: 0, transition: k.tween('fast') },
      active: {
        x: [0, 0, dir, 0],
        y: [0, 0, dir, 0],
        transition: seq(k, 'deliberate', [0, 0.25, 0.45, 1], ['linear', 'enter', 'emphasized']),
      },
    })
    return {
      slash: { from: hidden, rest: drawn(k), active: drawIn(k, 'slow', 0, 'emphasized') },
      top: kick(-1),
      bottom: kick(1),
    }
  },
  render: (v) => (
    <>
      <m.path d="M4.5 19.5 L19.5 4.5" variants={v.slash} />
      <m.circle cx="6.5" cy="6.5" r="3" variants={v.top} />
      <m.circle cx="17.5" cy="17.5" r="3" variants={v.bottom} />
    </>
  ),
})
