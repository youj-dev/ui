import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* The tail's start point travels with the head, so the arrow stretches instead of splitting. */
const tail = (x: number) => `M${x} 11 H12.5 A7 7 0 0 1 19.5 18`

/** Sent back: the arrow winds up, stretches out to the left and snaps back into shape. */
export const ReplyIcon = createIcon({
  name: 'reply',
  category: 'communication',
  keywords: ['respond', 'answer', 'back', 'email', 'message', 'return'],
  variants: (k) => {
    const t = seq(k, 'deliberate', [0, 0.2, 0.5, 1], ['standard', 'exit', 'emphasized'])
    return {
      head: {
        rest: { x: 0, transition: k.tween('fast') },
        active: { x: [0, 1, -2.25, 0], transition: t },
      },
      tail: {
        rest: { d: tail(4.5), transition: k.tween('fast') },
        active: { d: [tail(4.5), tail(5.5), tail(2.25), tail(4.5)], transition: t },
      },
    }
  },
  render: (v) => (
    <>
      <m.path d="M9.5 6 L4.5 11 L9.5 16" variants={v.head} />
      <m.path d={tail(4.5)} variants={v.tail} />
    </>
  ),
})
