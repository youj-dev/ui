import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Comparing changes: the plus turns a quarter and the minus pulses under it, one after the other. */
export const FileDiffIcon = createIcon({
  name: 'file-diff',
  category: 'files',
  keywords: ['diff', 'changes', 'compare', 'patch', 'additions and deletions', 'version'],
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
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      <m.g variants={v.plus} style={origin(12, 12)}>
        <path d="M12 9.75 V14.25" />
        <path d="M9.75 12 H14.25" />
      </m.g>
      <m.path d="M9.75 17 H14.25" variants={v.minus} style={origin(12, 17)} />
    </>
  ),
})
