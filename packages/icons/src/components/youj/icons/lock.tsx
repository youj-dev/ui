import { m } from 'motion/react'
import { createIcon, after, origin } from './icon-base'

/** Lock ↔ unlock. The shackle rises clear of the body, then swings open on its left leg. `active` = unlocked. */
export const LockIcon = createIcon({
  name: 'lock',
  category: 'security',
  keywords: ['security', 'password', 'private', 'unlock', 'secure', 'padlock'],
  states: ['locked', 'unlocked'],
  variants: (k) => ({
    shackle: {
      rest: { y: 0, rotate: 0, transition: { rotate: k.tween('fast'), y: after(k, k.duration('instant'), 'base') } },
      active: { y: -2, rotate: -14, transition: { y: k.tween('base', 'emphasized'), rotate: { ...k.spring('settle'), delay: k.duration('fast') } } },
    },
    keyhole: {
      rest: { scaleY: 1, transition: k.tween('fast') },
      active: { scaleY: [1, 0.3, 1], transition: { ...k.tween('base'), times: [0, 0.4, 1] } },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M8 11 V7.5 A4 4 0 0 1 16 7.5 V11" variants={v.shackle} style={origin(8, 11)} />
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <m.path d="M12 15 V17" variants={v.keyhole} style={origin(12, 16)} />
    </>
  ),
})
