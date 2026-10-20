import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Remove someone. The × turns a quarter beside the person, tucking in as it goes, while the person leans back from it and rights again. */
export const UserXIcon = createIcon({
  name: 'user-x',
  category: 'people',
  keywords: ['remove user', 'remove member', 'user-round-x', 'ban', 'block', 'kick', 'revoke access', 'delete user'],
  variants: (k) => ({
    person: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [null, -5, 0], transition: seq(k, 'deliberate', [0, 0.35, 1], ['standard', 'emphasized']) },
    },
    cross: {
      rest: { rotate: 0, scale: 1, transition: k.spring('snappy') },
      active: { rotate: 90, scale: [null, 0.78, 1], transition: { rotate: k.spring('snappy'), scale: seq(k, 'base', [0, 0.5, 1], ['exit', 'emphasized']) } },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.person} style={origin(9, 20.5)}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3 20.5 V19.5 A5.5 5.5 0 0 1 8.5 14 H9.5 A5.5 5.5 0 0 1 15 19.5 V20.5" />
      </m.g>
      <m.g variants={v.cross} style={origin(18.5, 11)}>
        <path d="M16.25 8.75 L20.75 13.25" />
        <path d="M20.75 8.75 L16.25 13.25" />
      </m.g>
    </>
  ),
})
