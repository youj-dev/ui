import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* theme's moon, drawn a little smaller to leave the corner to a star. */
const MOON = 'M11 3.5 A6.5 6.5 0 0 0 20.5 13 A8.5 8.5 0 1 1 11 3.5 Z'

/** Night falls: the crescent rocks gently and the star beside it winks on with a turn. */
export const MoonIcon = createIcon({
  name: 'moon',
  category: 'weather',
  keywords: ['moon', 'night', 'dark', 'sleep', 'evening', 'do not disturb', 'clear night'],
  variants: (k) => ({
    moon: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [null, -12, 4, 0], transition: seq(k, 'deliberate', [0, 0.35, 0.7, 1], ['standard', 'standard', 'emphasized']) },
    },
    star: {
      rest: { scale: 1, rotate: 0, transition: k.tween('base') },
      active: { scale: [null, 0, 1.25, 1], rotate: [null, 0, 90, 90], transition: seq(k, 'slow', [0, 0.3, 0.7, 1], ['exit', 'enter', 'standard'], k.duration('base')) },
    },
  }),
  render: (v) => (
    <>
      <m.path d={MOON} variants={v.moon} style={origin(12, 12)} />
      <m.path d="M18 3 V7 M16 5 H20" variants={v.star} style={origin(18, 5)} />
    </>
  ),
})
