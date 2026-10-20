import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Removing someone: the minus is struck toward the person, who steps back and fades before returning. */
export const UserMinusIcon = createIcon({
  name: 'user-minus',
  category: 'people',
  keywords: ['remove member', 'remove user', 'unfollow', 'leave', 'kick', 'delete user'],
  variants: (k) => ({
    person: {
      rest: { x: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        x: [0, -1.25, -1.25, 0],
        opacity: [1, 0.35, 0.35, 1],
        transition: seq(k, 'deliberate', [0, 0.35, 0.6, 1], ['exit', 'linear', 'emphasized']),
      },
    },
    minus: {
      rest: { pathLength: 1, opacity: 1, transition: k.tween('fast') },
      active: {
        pathLength: [1, 0, 1, 1],
        opacity: [1, 0, 1, 1],
        transition: {
          pathLength: seq(k, 'deliberate', [0, 0.15, 0.45, 1], ['exit', 'standard', 'linear']),
          opacity: seq(k, 'deliberate', [0, 0.14, 0.16, 1], ['linear', 'linear', 'linear']),
        },
      },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.person}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M3 20.5 V19.5 A5.5 5.5 0 0 1 8.5 14 H9.5 A5.5 5.5 0 0 1 15 19.5 V20.5" />
      </m.g>
      <m.path d="M21.5 11 H15.5" variants={v.minus} />
    </>
  ),
})
