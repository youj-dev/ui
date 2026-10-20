import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Edit profile: the pen beside the person scribbles and the person nods. */
export const UserPenIcon = createIcon({
  name: 'user-pen',
  category: 'people',
  keywords: ['edit profile', 'edit user', 'rename', 'update account', 'change details'],
  variants: (k) => ({
    head: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1.25, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], k.duration('base')) },
    },
    pen: {
      rest: { x: 0, y: 0, rotate: 0, transition: k.tween('fast') },
      active: { x: [0, -0.75, 0.5, -0.5, 0], y: [0, 0.5, -0.25, 0.25, 0], rotate: [0, -5, 4, -2, 0], transition: seq(k, 'deliberate', [0, 0.25, 0.5, 0.75, 1]) },
    },
  }),
  render: (v) => (
    <>
      <m.circle cx="9" cy="8" r="3.5" variants={v.head} />
      <path d="M3 20.5 V19.5 A5.5 5.5 0 0 1 8.5 14 H9.5 A5.5 5.5 0 0 1 15 19.5 V20.5" />
      <m.path d="M19.54 7.91 A0.78 0.78 0 0 1 20.64 9.01 L17.05 12.6 L15.25 13.25 L15.95 11.5 Z" variants={v.pen} style={origin(15.5, 13)} />
    </>
  ),
})
