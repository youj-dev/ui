import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Someone is typing: the three dots ripple through the bubble twice. */
export const MessageIcon = createIcon({
  name: 'message',
  category: 'communication',
  keywords: ['chat', 'comment', 'typing', 'reply', 'conversation', 'bubble'],
  variants: (k) => {
    const dot = (i: number) => ({
      rest: { y: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        y: [0, -1.75, 0, -1.75, 0],
        opacity: [1, 0.4, 1, 0.4, 1],
        transition: seq(k, 'deliberate', [0, 0.2, 0.45, 0.65, 1], undefined, i * k.stagger('base') * 1.5),
      },
    })
    return {
      bubble: {
        rest: { scale: 1, transition: k.tween('fast') },
        active: { scale: [1, 1.04, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
      },
      d0: dot(0),
      d1: dot(1),
      d2: dot(2),
    }
  },
  render: (v) => (
    <m.g variants={v.bubble} style={origin(8, 20)}>
      <path d="M4 6 A2 2 0 0 1 6 4 H18 A2 2 0 0 1 20 6 V15 A2 2 0 0 1 18 17 H11 L7 20.5 V17 H6 A2 2 0 0 1 4 15 Z" />
      {[8.5, 12, 15.5].map((x, i) => (
        <m.path key={x} d={`M${x} 10.5 h.01`} strokeWidth={2} variants={v[`d${i}` as 'd0']} />
      ))}
    </m.g>
  ),
})
