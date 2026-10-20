import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, origin, seq } from './icon-base'

/** Verified: the check is signed off beside the person, lands with a small settle, and the person nods. */
export const UserCheckIcon = createIcon({
  name: 'user-check',
  category: 'people',
  keywords: ['verified', 'approved', 'member', 'confirmed', 'accepted', 'trusted'],
  variants: (k) => ({
    check: {
      from: { ...hidden, scale: 0.85 },
      rest: { ...drawn(k), scale: 1 },
      active: {
        ...drawIn(k, 'slow'),
        scale: [0.85, 1],
        transition: { ...drawIn(k, 'slow').transition, scale: { ...k.spring('settle'), delay: k.duration('base') } },
      },
    },
    head: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1.25, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], k.duration('slow')) },
    },
  }),
  render: (v) => (
    <>
      <m.circle cx="9" cy="8" r="3.5" variants={v.head} />
      <path d="M3 20.5 V19.5 A5.5 5.5 0 0 1 8.5 14 H9.5 A5.5 5.5 0 0 1 15 19.5 V20.5" />
      <m.path d="M15.5 11 L17.5 13 L21.5 9" variants={v.check} style={origin(18.5, 11)} />
    </>
  ),
})
