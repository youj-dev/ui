import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** A small nod: the head dips and comes back up, and the shoulders follow through a beat later. */
export const UserIcon = createIcon({
  name: 'user',
  category: 'people',
  keywords: ['person', 'account', 'profile', 'avatar', 'member', 'me'],
  variants: (k) => ({
    head: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1.5, -0.5, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.62, 1], ['standard', 'standard', 'emphasized']) },
    },
    body: {
      rest: { scaleY: 1, transition: k.tween('fast') },
      active: { scaleY: [1, 0.94, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], k.stagger('loose')) },
    },
  }),
  render: (v) => (
    <>
      <m.circle cx="12" cy="7.5" r="4" variants={v.head} />
      <m.path d="M5 20.5 V20 A6 6 0 0 1 11 14 H13 A6 6 0 0 1 19 20 V20.5" variants={v.body} style={origin(12, 20.5)} />
    </>
  ),
})
