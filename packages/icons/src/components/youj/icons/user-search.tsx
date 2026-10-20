import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Finding someone: the lens beside the person looks up and down and the person nods. */
export const UserSearchIcon = createIcon({
  name: 'user-search',
  category: 'people',
  keywords: ['find user', 'search people', 'lookup member', 'find contact', 'directory'],
  variants: (k) => ({
    head: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1.25, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], k.duration('base')) },
    },
    lens: {
      rest: { x: 0, y: 0, transition: k.tween('fast') },
      active: { x: [0, -0.75, 0.75, 0], y: [0, -1, 1, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.65, 1]) },
    },
  }),
  render: (v) => (
    <>
      <m.circle cx="9" cy="8" r="3.5" variants={v.head} />
      <path d="M3 20.5 V19.5 A5.5 5.5 0 0 1 8.5 14 H9.5 A5.5 5.5 0 0 1 15 19.5 V20.5" />
      <m.g variants={v.lens}>
        <circle cx="17.5" cy="10" r="2.5" />
        <path d="M19.3 11.8 L21 13.5" />
      </m.g>
    </>
  ),
})
