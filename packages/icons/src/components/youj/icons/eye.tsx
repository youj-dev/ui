import { m } from 'motion/react'
import { createIcon, drawIn, drawOut, origin } from './icon-base'

/**
 * Eye ↔ eye-off. The eye blinks shut, and as it reopens a slash is drawn
 * through it with a matching gap cut behind. `active` = hidden.
 */
export const EyeIcon = createIcon({
  name: 'eye',
  category: 'system',
  keywords: ['view', 'visible', 'show', 'hide', 'password', 'preview'],
  states: ['visible', 'hidden'],
  variants: (k) => ({
    lid: {
      rest: { scaleY: 1, transition: k.tween('fast') },
      active: { scaleY: [1, 0.1, 1], transition: { ...k.tween('slow'), times: [0, 0.35, 1] } },
    },
    pupil: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0, 0.75], transition: { ...k.tween('slow'), times: [0, 0.35, 1] } },
    },
    slash: { rest: drawOut(k, 'fast'), active: drawIn(k, 'base', k.duration('fast'), 'standard') },
  }),
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d="M3.5 3.5 L20.5 20.5" stroke="black" strokeWidth={4.5} variants={v.slash} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <m.g variants={v.lid} style={origin(12, 12)}>
          <path d="M2.5 12 C4.5 7.8 8 5.5 12 5.5 C16 5.5 19.5 7.8 21.5 12 C19.5 16.2 16 18.5 12 18.5 C8 18.5 4.5 16.2 2.5 12 Z" />
          <m.circle cx="12" cy="12" r="3" variants={v.pupil} style={origin(12, 12)} />
        </m.g>
      </g>
      <m.path d="M3.5 3.5 L20.5 20.5" variants={v.slash} />
    </>
  ),
})
