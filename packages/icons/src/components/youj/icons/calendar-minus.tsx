import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The bar pulls in from both ends and springs back out while the calendar tugs on its rings. */
export const CalendarMinusIcon = createIcon({
  name: 'calendar-minus',
  category: 'time',
  keywords: ['remove event', 'fewer days', 'delete date', 'minus', 'shorten'],
  variants: (k) => ({
    sheet: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, 0.75, 0], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized']) },
    },
    bar: {
      rest: { scaleX: 1, transition: k.tween('fast') },
      active: { scaleX: [1, 0.3, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], k.stagger('base')) },
    },
  }),
  render: (v) => (
    <m.g variants={v.sheet}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10 H21 M8 3 V7 M16 3 V7" />
      <m.path d="M9 15.5 H15" variants={v.bar} style={origin(12, 15.5)} />
    </m.g>
  ),
})
