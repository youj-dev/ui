import { m } from 'motion/react'
import { createIcon, drawn, drawOut, origin, seq } from './icon-base'

/** Protection off ↔ on. The slash retracts and the shield braces back into service; turning it off draws the slash again with a gap cut behind. `active` = on. */
export const ShieldOffIcon = createIcon({
  name: 'shield-off',
  category: 'security',
  keywords: ['unprotected', 'security off', 'disabled', 'vulnerable', 'firewall off', 'unsafe'],
  states: ['off', 'on'],
  variants: (k) => ({
    slash: { rest: drawn(k, 'base'), active: drawOut(k, 'fast') },
    shield: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0.92, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized'], k.duration('fast')) },
    },
  }),
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d="M3.5 3.5 L20.5 20.5" stroke="black" strokeWidth={4.5} variants={v.slash} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <m.path d="M12 21.5 C7.5 20 4.5 16.5 4.5 12 V6 L12 2.75 L19.5 6 V12 C19.5 16.5 16.5 20 12 21.5 Z" variants={v.shield} style={origin(12, 12)} />
      </g>
      <m.path d="M3.5 3.5 L20.5 20.5" variants={v.slash} />
    </>
  ),
})
