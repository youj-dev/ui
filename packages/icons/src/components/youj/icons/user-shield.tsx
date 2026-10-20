import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Protected account: the shield beside the person braces and springs back, and the person nods. */
export const UserShieldIcon = createIcon({
  name: 'user-shield',
  category: 'people',
  keywords: ['admin', 'moderator', 'protected account', 'security', 'guard', 'privacy'],
  variants: (k) => ({
    head: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1.25, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], k.duration('base')) },
    },
    shield: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0.82, 1.06, 1], transition: seq(k, 'slow', [0, 0.3, 0.65, 1], ['exit', 'enter', 'standard']) },
    },
  }),
  render: (v) => (
    <>
      <m.circle cx="9" cy="8" r="3.5" variants={v.head} />
      <path d="M3 20.5 V19.5 A5.5 5.5 0 0 1 8.5 14 H9.5 A5.5 5.5 0 0 1 15 19.5 V20.5" />
      <m.path
        d="M18.5 15.25 C16.75 14.7 15.75 13.4 15.75 11.75 V8.75 L18.5 7.5 L21.25 8.75 V11.75 C21.25 13.4 20.25 14.7 18.5 15.25 Z"
        variants={v.shield}
        style={origin(18.5, 11.25)}
      />
    </>
  ),
})
