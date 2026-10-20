import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** A missed call: the handset rings once more, too late, and each stroke of the × pinches in beside it. */
export const PhoneMissedIcon = createIcon({
  name: 'phone-missed',
  category: 'communication',
  keywords: ['missed call', 'unanswered', 'call failed', 'declined', 'phone'],
  variants: (k) => {
    const pinch = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.4, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], i * k.stagger('loose')) },
    })
    return {
      handset: {
        rest: { rotate: 0, transition: k.tween('base') },
        active: { rotate: [0, -8, 6, -3, 0], transition: seq(k, 'deliberate', [0, 0.2, 0.45, 0.7, 1]) },
      },
      a: pinch(0),
      b: pinch(1),
    }
  },
  render: (v) => (
    <>
      <m.path d="M5 3.5 H8 L9.5 7.5 L7.5 9 A11 11 0 0 0 15 16.5 L16.5 14.5 L20.5 16 V19 A2 2 0 0 1 18.5 21 A16 16 0 0 1 3 5.5 A2 2 0 0 1 5 3.5 Z" variants={v.handset} style={origin(12, 12)} />
      <m.path d="M15.5 3.5 L20.5 8.5" variants={v.a} style={origin(18, 6)} />
      <m.path d="M20.5 3.5 L15.5 8.5" variants={v.b} style={origin(18, 6)} />
    </>
  ),
})
