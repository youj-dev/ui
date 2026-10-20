import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** A kind word: the heart in the bubble beats twice. */
export const MessageHeartIcon = createIcon({
  name: 'message-heart',
  category: 'communication',
  keywords: ['reaction', 'love', 'like message', 'favorite chat', 'kind', 'support'],
  variants: (k) => ({
    heart: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 1.3, 1, 1.2, 1], transition: seq(k, 'deliberate', [0, 0.18, 0.36, 0.54, 1], ['enter', 'standard', 'enter', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <path d="M4 6 A2 2 0 0 1 6 4 H18 A2 2 0 0 1 20 6 V15 A2 2 0 0 1 18 17 H11 L7 20.5 V17 H6 A2 2 0 0 1 4 15 Z" />
      <m.path d="M12 13.25 L9.27 10.73 A1.6 1.6 0 1 1 12 9.6 A1.6 1.6 0 1 1 14.73 10.73 Z" variants={v.heart} style={origin(12, 11)} />
    </>
  ),
})
