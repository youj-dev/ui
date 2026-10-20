import { m } from 'motion/react'
import { createIcon, drawOut, drawn, origin, seq } from './icon-base'

const SLASH = 'M3.5 3.5 L20.5 20.5'

/**
 * Camera on ↔ off. The lens blinks shut as the feed cuts and a slash is drawn
 * through, with a matching gap masked behind it. Turning it back on pulls the
 * slash out and the lens blinks open. `active` = off.
 */
export const VideoIcon = createIcon({
  name: 'video',
  category: 'communication',
  keywords: ['camera', 'video call', 'webcam', 'meeting', 'record', 'camera off', 'video off'],
  states: ['on', 'off'],
  variants: (k) => ({
    slash: { rest: drawOut(k, 'fast'), active: drawn(k, 'base', k.duration('instant')) },
    lens: {
      rest: { scaleY: [null, 0.35, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
      active: { scaleY: [null, 0.35, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
  }),
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d={SLASH} stroke="black" strokeWidth={4.5} variants={v.slash} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <rect x="3" y="6" width="12.5" height="12" rx="2" />
        <m.path d="M15.5 10.5 L21 7 V17 L15.5 13.5" variants={v.lens} style={origin(18.25, 12)} />
      </g>
      <m.path d={SLASH} variants={v.slash} />
    </>
  ),
})
