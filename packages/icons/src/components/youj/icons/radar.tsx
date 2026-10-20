import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/**
 * Scanning: the sweep goes once round the scope and the contact it passes
 * flares. Rest is a full turn, so leaving mid-sweep carries on forwards.
 */
export const RadarIcon = createIcon({
  name: 'radar',
  category: 'location',
  keywords: ['radar', 'scan', 'discover', 'nearby', 'detect', 'monitor', 'search', 'tracking'],
  variants: (k) => {
    const sweep = k.duration('deliberate') * 1.25
    return {
      sweep: {
        rest: { rotate: 360, transition: k.tween('base', 'enter') },
        active: { rotate: [0, 360], transition: { ...k.tween('deliberate', 'standard'), duration: sweep } },
      },
      /* The contact sits a quarter turn clockwise of the sweep's start, so it flares a quarter of the way round. */
      contact: {
        rest: { scale: 1, transition: k.tween('fast') },
        active: { scale: [null, 1, 1.9, 1], transition: seq(k, 'slow', [0, 0.2, 0.45, 1], ['linear', 'exit', 'emphasized'], sweep * 0.12) },
      },
    }
  },
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <m.path d="M12 12 L18.36 5.64" variants={v.sweep} style={origin(12, 12)} />
      <m.path d="M16.25 15.5 h.01" strokeWidth={2.25} variants={v.contact} style={origin(16.25, 15.5)} />
    </>
  ),
})
