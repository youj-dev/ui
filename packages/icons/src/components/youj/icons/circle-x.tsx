import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Error. The badge shakes its head while each stroke of the × pinches in to its center and snaps back, one after the other. */
export const CircleXIcon = createIcon({
  name: 'circle-x',
  category: 'status',
  keywords: ['error', 'failed', 'close', 'cancel', 'remove', 'invalid', 'clear', 'x-circle', 'circle-x'],
  variants: (k) => {
    const pinch = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.4, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], i * k.stagger('loose')) },
    })
    return {
      badge: {
        rest: { x: 0, transition: k.tween('fast') },
        active: { x: [null, -1.25, 1.25, -0.75, 0.4, 0], transition: seq(k, 'deliberate', [0, 0.15, 0.35, 0.55, 0.75, 1]) },
      },
      a: pinch(0),
      b: pinch(1),
    }
  },
  render: (v) => (
    <m.g variants={v.badge}>
      <circle cx="12" cy="12" r="9" />
      <m.path d="M15 9 L9 15" variants={v.a} style={origin(12, 12)} />
      <m.path d="M9 9 L15 15" variants={v.b} style={origin(12, 12)} />
    </m.g>
  ),
})
