import { m } from 'motion/react'
import { after, createIcon, origin, seq } from './icon-base'

/* A status dot, 6 units across: four pixels at 16px, enough to read as a dot
 * beside text, with room round it for the ripple. The ripple waits under it. */
const R = 3

/**
 * A blip: a ring ripples out from the dot to the edge of the keyline circle
 * and fades as it goes, while the dot swells once and settles. With
 * `trigger="loop"` it's a live indicator.
 */
export const DotIcon = createIcon({
  name: 'dot',
  category: 'status',
  keywords: ['dot', 'status', 'online', 'live', 'bullet', 'point', 'indicator', 'presence', 'recording'],
  variants: (k) => ({
    dot: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 1.25, 1], transition: seq(k, 'slow', [0, 0.3, 1], ['standard', 'emphasized']) },
    },
    ripple: {
      rest: { r: R, opacity: 0, transition: { opacity: k.tween('fast', 'exit'), r: after(k, k.duration('fast'), 'instant') } },
      active: { r: [R, 9], opacity: [0.8, 0], transition: { r: k.tween('deliberate', 'enter'), opacity: k.tween('deliberate', 'standard') } },
    },
  }),
  render: (v) => (
    <>
      <m.circle cx="12" cy="12" r={R} variants={v.ripple} />
      <m.circle cx="12" cy="12" r={R} fill="currentColor" stroke="none" variants={v.dot} style={origin(12, 12)} />
    </>
  ),
})
