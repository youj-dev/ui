import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/**
 * Read ↔ unread. A badge pops onto the bell's shoulder with a settle and
 * cuts its own gap out of the body, and the bell rings once beneath it;
 * marking as read lets the badge shrink away and the gap closes behind it.
 * `active` = unread.
 */
export const BellDotIcon = createIcon({
  name: 'bell-dot',
  category: 'status',
  keywords: ['notification', 'unread', 'badge', 'new', 'alert', 'inbox', 'activity'],
  states: ['read', 'unread'],
  variants: (k) => {
    const pop = { ...k.spring('settle'), delay: k.duration('instant') }
    return {
      badge: {
        rest: { scale: 0, transition: k.tween('fast', 'exit') },
        active: { scale: 1, transition: pop },
      },
      body: {
        rest: { rotate: 0, transition: k.tween('base') },
        active: { rotate: [null, 12, -8, 4, 0], transition: seq(k, 'slow', [0, 0.25, 0.5, 0.75, 1], undefined, k.duration('fast')) },
      },
    }
  },
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.circle cx="18" cy="5" r="4" fill="black" stroke="none" variants={v.badge} style={origin(18, 5)} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <m.g variants={v.body} style={origin(12, 3.5)}>
          <path d="M6 9.5 A6 6 0 0 1 18 9.5 V13.5 L20 16.5 H4 L6 13.5 Z" />
          <path d="M10 19.5 A2 2 0 0 0 14 19.5" />
        </m.g>
      </g>
      <m.circle cx="18" cy="5" r="2.5" fill="currentColor" stroke="none" variants={v.badge} style={origin(18, 5)} />
    </>
  ),
})
