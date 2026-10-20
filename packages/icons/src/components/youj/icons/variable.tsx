import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The brackets close in on the x as it turns a quarter, then let go. */
export const VariableIcon = createIcon({
  name: 'variable',
  category: 'data',
  keywords: ['variable', 'parameter', 'formula', 'placeholder', 'math', 'value'],
  variants: (k) => ({
    left: {
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [0, 1, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
    right: {
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [0, -1, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
    x: {
      rest: { rotate: 0, transition: k.spring('snappy') },
      active: { rotate: 90, transition: k.spring('snappy') },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M7 4 C4.5 7.5 4.5 16.5 7 20" variants={v.left} />
      <m.path d="M17 4 C19.5 7.5 19.5 16.5 17 20" variants={v.right} />
      <m.g variants={v.x} style={origin(12, 12)}>
        <path d="M9.5 9.5 L14.5 14.5" />
        <path d="M14.5 9.5 L9.5 14.5" />
      </m.g>
    </>
  ),
})
