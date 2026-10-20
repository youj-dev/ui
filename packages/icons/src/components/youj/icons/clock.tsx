import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/**
 * An hour passes: the minute hand sweeps once around while the hour hand steps
 * forward one hour. The minute hand rests at a full turn, so leaving mid-sweep
 * finishes the lap forwards.
 */
export const ClockIcon = createIcon({
  name: 'clock',
  category: 'time',
  keywords: ['time', 'hour', 'schedule', 'recent', 'duration', 'watch'],
  variants: (k) => ({
    minute: {
      rest: { rotate: 360, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 360], transition: k.tween('deliberate', 'emphasized') },
    },
    hour: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, 30], transition: k.tween('deliberate', 'emphasized') },
    },
  }),
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <m.path d="M12 12 L15 13.75" variants={v.hour} style={origin(12, 12)} />
      <m.path d="M12 12 V7" variants={v.minute} style={origin(12, 12)} />
    </>
  ),
})
