import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

const PAGE = 'M3 10 V19 A2 2 0 0 0 5 21 H19 A2 2 0 0 0 21 19 V10'

/**
 * A day is torn off: the binding tugs and the sheet flips up over it and away,
 * revealing the next one underneath. The flipping sheet sits exactly on the
 * page below it, so it resets out of sight.
 */
export const CalendarIcon = createIcon({
  name: 'calendar',
  category: 'time',
  keywords: ['date', 'schedule', 'event', 'day', 'month', 'planner', 'agenda'],
  variants: (k) => ({
    sheet: {
      rest: { scaleY: 1, opacity: 1, transition: k.tween('fast') },
      active: {
        scaleY: [1, -0.35, -0.35, 1, 1],
        opacity: [1, 1, 0, 0, 1],
        transition: {
          scaleY: seq(k, 'deliberate', [0, 0.55, 0.9, 0.91, 1], ['exit', 'linear', 'linear', 'linear']),
          opacity: seq(k, 'deliberate', [0, 0.35, 0.55, 0.99, 1], ['linear', 'linear', 'linear', 'linear']),
        },
      },
    },
    rings: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -0.75, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <path d="M3 10 V7 A2 2 0 0 1 5 5 H19 A2 2 0 0 1 21 7 V10 H3" />
      <path d={PAGE} />
      <m.path d={PAGE} variants={v.sheet} style={origin(12, 10)} />
      <m.g variants={v.rings}>
        <path d="M8 3 V7" />
        <path d="M16 3 V7" />
      </m.g>
    </>
  ),
})
