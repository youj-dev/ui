import { m } from 'motion/react'
import { createIcon, drawIn, drawOut } from './icon-base'

/**
 * Mic ↔ muted. A slash is drawn through the mic and a matching gap is cut
 * behind it with a mask, so the strokes never collide.
 */
export const MicIcon = createIcon({
  name: 'mic',
  category: 'media',
  keywords: ['microphone', 'record', 'voice', 'audio', 'mute', 'dictate'],
  states: ['live', 'muted'],
  variants: (k) => ({
    slash: { rest: drawOut(k, 'fast'), active: drawIn(k, 'base', 0, 'standard') },
  }),
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d="M3.5 3.5 L20.5 20.5" stroke="black" strokeWidth={4.5} variants={v.slash} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5.5 11 A6.5 6.5 0 0 0 18.5 11" />
        <path d="M12 17.5 V21" />
      </g>
      <m.path d="M3.5 3.5 L20.5 20.5" variants={v.slash} />
    </>
  ),
})
