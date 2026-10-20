import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* The shoulders are the top of a circle centered below the ring, clipped to the
 * ring's inside: they run behind the ring wherever the nod moves them. */
const SHOULDERS = 'M5.5 21.75 A6.5 6.5 0 0 1 18.5 21.75'

/** An avatar that nods: the head dips and comes back up inside the ring, and the shoulders follow through a beat later. */
export const CircleUserIcon = createIcon({
  name: 'circle-user',
  category: 'people',
  keywords: ['user-circle', 'avatar', 'account', 'profile', 'me', 'person', 'signed in'],
  variants: (k) => ({
    head: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, 1.25, -0.4, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.62, 1], ['standard', 'standard', 'emphasized']) },
    },
    body: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, 0.75, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], k.stagger('loose')) },
    },
  }),
  render: (v, { id }) => (
    <>
      <clipPath id={`${id}-c`}>
        <circle cx="12" cy="12" r="9" />
      </clipPath>
      <circle cx="12" cy="12" r="9" />
      <m.circle cx="12" cy="9.5" r="3.25" variants={v.head} />
      <g clipPath={`url(#${id}-c)`}>
        <m.path d={SHOULDERS} variants={v.body} />
      </g>
    </>
  ),
})
