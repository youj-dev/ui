import { m } from 'motion/react'
import { createIcon, after, drawIn, drawOut } from './icon-base'

/**
 * Copy → copied. The back sheet tucks in behind the front one, then a check is
 * written on the page. Reverting erases the check first.
 */
export const CopyIcon = createIcon({
  name: 'copy',
  category: 'actions',
  keywords: ['clipboard', 'duplicate', 'copied', 'paste'],
  states: ['copy', 'copied'],
  variants: (k) => ({
    back: {
      rest: { x: 0, y: 0, opacity: 1, transition: after(k, k.duration('fast'), 'base') },
      active: { x: 3, y: 3, opacity: 0, transition: k.tween('base', 'exit') },
    },
    front: {
      rest: { x: 0, y: 0, transition: after(k, k.duration('fast'), 'base') },
      active: { x: -3, y: -3, transition: k.tween('base') },
    },
    check: {
      rest: drawOut(k),
      active: drawIn(k, 'slow', k.duration('base')),
    },
  }),
  render: (v) => (
    <>
      <m.path d="M15 9 V5 A2 2 0 0 0 13 3 H5 A2 2 0 0 0 3 5 V13 A2 2 0 0 0 5 15 H9" variants={v.back} />
      <m.g variants={v.front}>
        <rect x="9" y="9" width="12" height="12" rx="2" />
        <m.path d="M12 15 L14 17 L18 13" variants={v.check} />
      </m.g>
    </>
  ),
})
