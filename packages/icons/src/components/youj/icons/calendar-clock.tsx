import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/**
 * Scheduling: the clock's minute hand sweeps a full hour while the hour hand
 * steps on one mark. Rest is the full turn, so the sweep always runs
 * forwards.
 */
export const CalendarClockIcon = createIcon({
  name: 'calendar-clock',
  category: 'time',
  keywords: ['schedule', 'send later', 'reminder', 'appointment', 'deadline', 'calendar', 'time'],
  variants: (k) => ({
    minute: {
      rest: { rotate: 360, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 360], transition: k.tween('deliberate', 'standard') },
    },
    hour: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: 30, transition: { ...k.tween('fast'), delay: k.duration('deliberate') * 0.8 } },
    },
  }),
  render: (v) => (
    <>
      <path d="M20.5 9.5 V6.5 A2 2 0 0 0 18.5 4.5 H5.5 A2 2 0 0 0 3.5 6.5 V18.5 A2 2 0 0 0 5.5 20.5 H9" />
      <path d="M8 2.5 V6.5 M16 2.5 V6.5 M3.5 10 H9" />
      <circle cx="16.5" cy="16.5" r="5" />
      <m.path d="M16.5 16.5 V13.5" variants={v.minute} style={origin(16.5, 16.5)} />
      <m.path d="M16.5 16.5 L18.25 17.5" variants={v.hour} style={origin(16.5, 16.5)} />
    </>
  ),
})
