import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

const TEETH = ['M18.25 8.45 L18.25 7.9', 'M20.46 9.72 L20.93 9.45', 'M20.46 12.28 L20.93 12.55', 'M18.25 13.55 L18.25 14.1', 'M16.04 12.28 L15.57 12.55', 'M16.04 9.72 L15.57 9.45']

/** Account settings: the cog beside the person turns one tooth on and the person nods. */
export const UserCogIcon = createIcon({
  name: 'user-cog',
  category: 'people',
  keywords: ['account settings', 'profile settings', 'preferences', 'manage user', 'admin', 'configure'],
  variants: (k) => ({
    head: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1.25, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], k.duration('base')) },
    },
    cog: {
      rest: { rotate: 0, transition: k.tween('fast') },
      active: { rotate: 60, transition: seq(k, 'deliberate', [0, 1], ['emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.circle cx="9" cy="8" r="3.5" variants={v.head} />
      <path d="M3 20.5 V19.5 A5.5 5.5 0 0 1 8.5 14 H9.5 A5.5 5.5 0 0 1 15 19.5 V20.5" />
      <m.g variants={v.cog} style={origin(18.25, 11)}>
        <circle cx="18.25" cy="11" r="1.75" />
        {TEETH.map((d) => (
          <path key={d} d={d} />
        ))}
      </m.g>
    </>
  ),
})
