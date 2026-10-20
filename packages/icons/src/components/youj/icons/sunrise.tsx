import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* The arrow's head keeps its tips' x and trades the apex's height with
 * theirs, so it folds flat across the shaft and turns over. The sun is an r4.5
 * disc clipped at the horizon, with three rays that travel with it. */
const HEAD = ['M9.75 4.75 L12 2.5 L14.25 4.75', 'M9.75 4.25 L12 6.5 L14.25 4.25'] as const
const RAYS = 'M12 11 V9.5 M7.76 12.76 L6.7 11.7 M16.24 12.76 L17.3 11.7'

/**
 * Sunrise ↔ sunset. The sun sinks behind the horizon, rays and all, as the
 * arrow above turns to point down; sunrise lifts it back up and turns the
 * arrow over. `active` = sunset.
 */
export const SunriseIcon = createIcon({
  name: 'sunrise',
  category: 'weather',
  keywords: ['sunrise', 'sunset', 'morning', 'evening', 'dawn', 'dusk', 'daylight', 'schedule'],
  states: ['sunrise', 'sunset'],
  variants: (k) => ({
    sun: {
      rest: { y: 0, transition: k.tween('slow', 'emphasized') },
      active: { y: 2.5, transition: k.tween('slow', 'emphasized') },
    },
    head: {
      rest: { d: HEAD[0], transition: k.tween('base', 'emphasized') },
      active: { d: HEAD[1], transition: k.tween('base', 'emphasized') },
    },
  }),
  render: (v, { id }) => (
    <>
      <clipPath id={`${id}-c`}>
        <rect x="0" y="0" width="24" height="17.25" />
      </clipPath>
      <g clipPath={`url(#${id}-c)`}>
        <m.g variants={v.sun}>
          <circle cx="12" cy="17" r="4.5" />
          <path d={RAYS} />
        </m.g>
      </g>
      <path d="M2.5 18 H21.5" />
      <path d="M12 2.5 V6.5" />
      <m.path d={HEAD[0]} variants={v.head} />
    </>
  ),
})
