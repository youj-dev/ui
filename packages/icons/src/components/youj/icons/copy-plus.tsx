import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Duplicate. The two sheets slide apart and hold there, and the plus on the new one pops in; letting go stacks them again. */
export const CopyPlusIcon = createIcon({
  name: 'copy-plus',
  category: 'actions',
  keywords: ['duplicate', 'clone', 'copy', 'replicate', 'add copy', 'make a copy'],
  variants: (k) => ({
    back: {
      rest: { x: 0, y: 0, transition: k.spring('snappy') },
      active: { x: -1, y: -1, transition: k.spring('snappy') },
    },
    front: {
      rest: { x: 0, y: 0, transition: k.spring('snappy') },
      active: { x: 1, y: 1, transition: k.spring('snappy') },
    },
    plus: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.35, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized'], k.duration('instant')) },
    },
  }),
  render: (v) => (
    <>
      <m.path d="M15 9 V5 A2 2 0 0 0 13 3 H5 A2 2 0 0 0 3 5 V13 A2 2 0 0 0 5 15 H9" variants={v.back} />
      <m.g variants={v.front}>
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <m.g variants={v.plus} style={origin(15, 15)}>
          <path d="M15 12.5 V17.5" />
          <path d="M12.5 15 H17.5" />
        </m.g>
      </m.g>
    </>
  ),
})
