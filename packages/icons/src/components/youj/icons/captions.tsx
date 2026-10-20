import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

const FRAME = { x: 2.5, y: 5, width: 19, height: 14, rx: 2 }
const LINES = 'M6.5 11 H11 M13.5 11 H17.5 M6.5 15 H9 M11.5 15 H17.5'

/**
 * Captions off ↔ on. A solid fill wipes across the frame from the left and
 * the caption lines turn into cut-outs exactly where it passes, so the text
 * is never drawn twice; switching off wipes it back. `active` = on.
 */
export const CaptionsIcon = createIcon({
  name: 'captions',
  category: 'media',
  keywords: ['captions', 'subtitles', 'cc', 'closed captions', 'transcript', 'accessibility', 'video'],
  states: ['off', 'on'],
  variants: (k) => {
    const wipe = k.tween('slow', 'emphasized')
    return {
      /* Two clips across the frame's width that always add up to it: the fill's grows from the left edge, the lines' shrinks towards the right. */
      filled: { rest: { scaleX: 0, transition: wipe }, active: { scaleX: 1, transition: wipe } },
      open: { rest: { scaleX: 1, transition: wipe }, active: { scaleX: 0, transition: wipe } },
    }
  },
  render: (v, { id }) => (
    <>
      <clipPath id={`${id}-f`}>
        <m.rect x={FRAME.x} y="0" width={FRAME.width} height="24" variants={v.filled} style={origin(FRAME.x, 12)} />
      </clipPath>
      <clipPath id={`${id}-o`}>
        <m.rect x={FRAME.x} y="0" width={FRAME.width} height="24" variants={v.open} style={origin(FRAME.x + FRAME.width, 12)} />
      </clipPath>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <path d={LINES} stroke="black" />
      </mask>
      <rect {...FRAME} />
      <g clipPath={`url(#${id}-f)`} mask={`url(#${id}-m)`}>
        <rect {...FRAME} fill="currentColor" />
      </g>
      <g clipPath={`url(#${id}-o)`}>
        <path d={LINES} />
      </g>
    </>
  ),
})
