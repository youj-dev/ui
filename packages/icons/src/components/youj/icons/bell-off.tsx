import { m } from 'motion/react'
import { createIcon, drawOut, drawn, origin, seq } from './icon-base'

const BODY = 'M6 9.5 A6 6 0 0 1 18 9.5 V13.5 L20 16.5 H4 L6 13.5 Z'
const CLAPPER = 'M10 19.5 A2 2 0 0 0 14 19.5'
const SLASH = 'M3.5 3.5 L20.5 20.5'
const SWING = [0, 0.18, 0.36, 0.54, 0.72, 1]

/**
 * Muted ↔ ringing. The slash is pulled out and the gap behind it closes, then
 * the bell swings back to life with the clapper a beat late. Muting draws the
 * slash back through a still bell. `active` = notifications on.
 */
export const BellOffIcon = createIcon({
  name: 'bell-off',
  category: 'communication',
  keywords: ['mute', 'notifications off', 'silent', 'do not disturb', 'unmute', 'snooze'],
  states: ['off', 'on'],
  variants: (k) => {
    const after = k.duration('fast')
    return {
      slash: { rest: drawn(k, 'base'), active: drawOut(k, 'fast') },
      body: {
        rest: { rotate: 0, transition: k.tween('base') },
        active: { rotate: [null, 14, -11, 7, -3, 0], transition: seq(k, 'deliberate', SWING, undefined, after) },
      },
      clapper: {
        rest: { rotate: 0, transition: k.tween('base') },
        active: { rotate: [null, 20, -16, 10, -4, 0], transition: seq(k, 'deliberate', SWING, undefined, after + k.stagger('loose')) },
      },
    }
  },
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d={SLASH} stroke="black" strokeWidth={4.5} variants={v.slash} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <m.path d={BODY} variants={v.body} style={origin(12, 3.5)} />
        <m.path d={CLAPPER} variants={v.clapper} style={origin(12, 3.5)} />
      </g>
      <m.path d={SLASH} variants={v.slash} />
    </>
  ),
})
