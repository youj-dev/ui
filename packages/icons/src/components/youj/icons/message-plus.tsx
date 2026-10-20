import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Start a conversation: the plus turns a quarter inside the bubble with a small press, and the bubble swells. */
export const MessagePlusIcon = createIcon({
  name: 'message-plus',
  category: 'communication',
  keywords: ['new chat', 'new message', 'start conversation', 'compose', 'add comment', 'reply'],
  variants: (k) => ({
    bubble: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 1.04, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
    cross: {
      rest: { rotate: 0, scale: 1, transition: k.spring('snappy') },
      active: { rotate: 90, scale: [null, 0.78, 1], transition: { rotate: k.spring('snappy'), scale: seq(k, 'base', [0, 0.5, 1], ['exit', 'emphasized']) } },
    },
  }),
  render: (v) => (
    <m.g variants={v.bubble} style={origin(8, 20)}>
      <path d="M4 6 A2 2 0 0 1 6 4 H18 A2 2 0 0 1 20 6 V15 A2 2 0 0 1 18 17 H11 L7 20.5 V17 H6 A2 2 0 0 1 4 15 Z" />
      <m.g variants={v.cross} style={origin(12, 10.5)}>
        <path d="M12 7.5 V13.5" />
        <path d="M9 10.5 H15" />
      </m.g>
    </m.g>
  ),
})
