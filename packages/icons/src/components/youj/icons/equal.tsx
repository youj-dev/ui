import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The two bars part a little and close back to equal. */
export const EqualIcon = createIcon({
  name: 'equal',
  category: 'data',
  keywords: ['equals', 'same', 'result', 'math', 'balance', 'compare'],
  variants: (k) => ({
    top: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -1.5, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
    bottom: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1.5, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M5.5 9.5 H18.5" variants={v.top} />
      <m.path d="M5.5 14.5 H18.5" variants={v.bottom} />
    </>
  ),
})
