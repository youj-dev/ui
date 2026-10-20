import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Finding a channel: the antenna is nudged one way and the other until the picture settles. */
export const TvIcon = createIcon({
  name: 'tv',
  category: 'devices',
  keywords: ['television', 'tv', 'screen', 'display', 'streaming', 'watch'],
  variants: (k) => ({
    antenna: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, -14, 10, -4, 0], transition: seq(k, 'deliberate', [0, 0.25, 0.5, 0.75, 1]) },
    },
  }),
  render: (v) => (
    <>
      <rect x="2.5" y="7.5" width="19" height="13" rx="2" />
      <m.path d="M8.5 3.5 L12 7.5 L15.5 3.5" variants={v.antenna} style={origin(12, 7.5)} />
    </>
  ),
})
