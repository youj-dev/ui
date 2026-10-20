import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, origin, seq } from './icon-base'

/** The trip is planned: the start pulses, the route is traced out of it, and the destination lands with a settle as the line arrives. */
export const RouteIcon = createIcon({
  name: 'route',
  category: 'location',
  keywords: ['path', 'journey', 'trip', 'directions', 'waypoint', 'delivery'],
  variants: (k) => {
    const depart = k.duration('fast')
    return {
      start: {
        rest: { scale: 1, transition: k.tween('fast') },
        active: { scale: [null, 0.6, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
      },
      path: { from: hidden, rest: drawn(k), active: drawIn(k, 'deliberate', depart, 'emphasized') },
      end: {
        from: { scale: 0 },
        rest: { scale: 1, transition: k.tween('fast') },
        active: { scale: [0, 1], transition: { ...k.spring('settle'), delay: depart + k.duration('deliberate') * 0.7 } },
      },
    }
  },
  render: (v) => (
    <>
      <m.circle cx="6" cy="18" r="3" variants={v.start} style={origin(6, 18)} />
      <m.path d="M9 18 H16.5 A3 3 0 0 0 16.5 12 H7.5 A3 3 0 0 1 7.5 6 H15" variants={v.path} />
      <m.circle cx="18" cy="6" r="3" variants={v.end} style={origin(18, 6)} />
    </>
  ),
})
