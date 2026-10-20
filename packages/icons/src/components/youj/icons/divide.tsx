import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Divided: the dots are pushed away from the bar and spring back. */
export const DivideIcon = createIcon({
  name: 'divide',
  category: 'data',
  keywords: ['division', 'divide', 'math', 'split', 'ratio', 'calculate'],
  variants: (k) => ({
    top: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -2, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['standard', 'emphasized']) },
    },
    bottom: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 2, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <path d="M5.5 12 H18.5" />
      <m.path d="M12 7 h.01" strokeWidth={2.5} variants={v.top} />
      <m.path d="M12 17 h.01" strokeWidth={2.5} variants={v.bottom} />
    </>
  ),
})
