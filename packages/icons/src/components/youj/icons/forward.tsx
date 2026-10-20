import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* The tail's start point travels with the head, so the arrow stretches instead of splitting. */
const tail = (x: number) => `M${x} 11 H11.5 A7 7 0 0 0 4.5 18`

/** Passed on: the arrow draws back, throws itself forward along its curve and lands in shape. */
export const ForwardIcon = createIcon({
  name: 'forward',
  category: 'communication',
  keywords: ['forward', 'pass on', 'share', 'email', 'message', 'send on'],
  variants: (k) => {
    const t = seq(k, 'deliberate', [0, 0.24, 0.52, 1], ['standard', 'exit', 'emphasized'])
    return {
      head: {
        rest: { x: 0, transition: k.tween('fast') },
        active: { x: [0, -1.25, 2.25, 0], transition: t },
      },
      tail: {
        rest: { d: tail(19.5), transition: k.tween('fast') },
        active: { d: [tail(19.5), tail(18.25), tail(21.75), tail(19.5)], transition: t },
      },
    }
  },
  render: (v) => (
    <>
      <m.path d="M14.5 6 L19.5 11 L14.5 16" variants={v.head} />
      <m.path d={tail(19.5)} variants={v.tail} />
    </>
  ),
})
