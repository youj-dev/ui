import { m } from 'motion/react'
import { createIcon, drawOut, drawn, origin, seq } from './icon-base'

const SLASH = 'M3.5 3.5 L20.5 20.5'

/**
 * Offline ↔ online. The slash is pulled out and the gap behind it closes,
 * then the cloud takes a breath and lifts back into place; losing the
 * connection draws the slash back through a still cloud. `active` = online.
 */
export const CloudOffIcon = createIcon({
  name: 'cloud-off',
  category: 'system',
  keywords: ['offline', 'disconnected', 'no connection', 'sync paused', 'cloud', 'online', 'reconnect'],
  states: ['offline', 'online'],
  variants: (k) => ({
    slash: { rest: drawn(k, 'base'), active: drawOut(k, 'fast') },
    cloud: {
      rest: { y: 0, scale: 1, transition: k.tween('base') },
      active: {
        y: [null, -1.25, 0],
        scale: [null, 1.05, 1],
        transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], k.duration('fast')),
      },
    },
  }),
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d={SLASH} stroke="black" strokeWidth={4.5} variants={v.slash} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <m.path
          d="M17 18.5 H7 A3 3 0 0 1 6.73 12.51 A5 5 0 1 1 16.48 10.53 A4 4 0 1 1 17 18.5"
          variants={v.cloud}
          style={origin(12, 18.5)}
        />
      </g>
      <m.path d={SLASH} variants={v.slash} />
    </>
  ),
})
