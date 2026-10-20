import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Blocked: the shield shakes off a hit while each stroke of the × pinches in to its centre and snaps back. */
export const ShieldXIcon = createIcon({
  name: 'shield-x',
  category: 'security',
  keywords: ['unprotected', 'threat', 'blocked', 'insecure', 'security error', 'denied'],
  variants: (k) => {
    const pinch = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.4, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], i * k.stagger('loose')) },
    })
    return {
      shield: {
        rest: { x: 0, transition: k.tween('fast') },
        active: { x: [null, -1, 1, -0.6, 0.3, 0], transition: seq(k, 'deliberate', [0, 0.15, 0.35, 0.55, 0.75, 1]) },
      },
      a: pinch(0),
      b: pinch(1),
    }
  },
  render: (v) => (
    <m.g variants={v.shield}>
      <path d="M12 21.5 C7.5 20 4.5 16.5 4.5 12 V6 L12 2.75 L19.5 6 V12 C19.5 16.5 16.5 20 12 21.5 Z" />
      <m.path d="M14.5 9.5 L9.5 14.5" variants={v.a} style={origin(12, 12)} />
      <m.path d="M9.5 9.5 L14.5 14.5" variants={v.b} style={origin(12, 12)} />
    </m.g>
  ),
})
