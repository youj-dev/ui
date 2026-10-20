import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/** A date range: the span is drawn across the first week and carries on into the next. */
export const CalendarRangeIcon = createIcon({
  name: 'calendar-range',
  category: 'time',
  keywords: ['date range', 'period', 'booking', 'stay', 'from to', 'duration', 'span'],
  variants: (k) => ({
    a: { rest: drawn(k), active: drawIn(k, 'base', 0, 'standard') },
    b: { rest: drawn(k), active: drawIn(k, 'base', k.duration('base'), 'standard') },
  }),
  render: (v) => (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10 H21 M8 3 V7 M16 3 V7" />
      <m.path d="M7 14 H17" variants={v.a} />
      <m.path d="M7 17.5 H12.5" variants={v.b} />
    </>
  ),
})
