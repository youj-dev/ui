import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Cancelled: the calendar tugs on its rings while each stroke of the × pinches in to its centre and snaps back. */
export const CalendarXIcon = createIcon({
  name: 'calendar-x',
  category: 'time',
  keywords: ['cancel event', 'remove date', 'unavailable', 'cancelled', 'delete event', 'busy'],
  variants: (k) => {
    const pinch = (i: number) => ({
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.4, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], i * k.stagger('loose')) },
    })
    return {
      sheet: {
        rest: { y: 0, transition: k.tween('fast') },
        active: { y: [null, 0.75, 0], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized']) },
      },
      a: pinch(0),
      b: pinch(1),
    }
  },
  render: (v) => (
    <m.g variants={v.sheet}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10 H21 M8 3 V7 M16 3 V7" />
      <m.path d="M14.5 13 L9.5 18" variants={v.a} style={origin(12, 15.5)} />
      <m.path d="M9.5 13 L14.5 18" variants={v.b} style={origin(12, 15.5)} />
    </m.g>
  ),
})
