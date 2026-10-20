import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Which way: the two boards swing on the post, one after the other, and settle. */
export const SignpostIcon = createIcon({
  name: 'signpost',
  category: 'location',
  keywords: ['directions', 'wayfinding', 'crossroads', 'guide', 'route', 'navigation'],
  variants: (k) => {
    const swing = (i: number) => ({
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, i ? 8 : -8, i ? -4 : 4, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.65, 1], undefined, i * k.stagger('loose')) },
    })
    return { right: swing(0), left: swing(1) }
  },
  render: (v) => (
    <>
      <path d="M12 3 V21" />
      <path d="M9 21 H15" />
      <m.path d="M12 5 H17.5 L19.75 7.25 L17.5 9.5 H12" variants={v.right} style={origin(12, 7.25)} />
      <m.path d="M12 11.5 H6.5 L4.25 13.75 L6.5 16 H12" variants={v.left} style={origin(12, 13.75)} />
    </>
  ),
})
