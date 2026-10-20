import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** More or less: the plus turns a quarter and the minus under it pulls in and out. */
export const PlusMinusIcon = createIcon({
  name: 'plus-minus',
  category: 'data',
  keywords: ['plus or minus', 'tolerance', 'adjust', 'approximately', 'increase decrease', 'math'],
  variants: (k) => ({
    plus: {
      rest: { rotate: 0, transition: k.spring('snappy') },
      active: { rotate: 90, transition: k.spring('snappy') },
    },
    minus: {
      rest: { scaleX: 1, transition: k.tween('fast') },
      active: { scaleX: [1, 0.4, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], k.duration('fast')) },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.plus} style={origin(12, 8.5)}>
        <path d="M12 4.5 V12.5" />
        <path d="M8 8.5 H16" />
      </m.g>
      <m.path d="M8 18 H16" variants={v.minus} style={origin(12, 18)} />
    </>
  ),
})
