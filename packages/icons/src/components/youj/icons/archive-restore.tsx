import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* archive's lid and box. The arrow's head keeps its tips' x and trades the
 * apex's height with theirs, so it folds flat across the shaft and turns
 * over, as sort's does. */
const HEAD = ['M9.5 14.5 L12 17 L14.5 14.5', 'M9.5 13.5 L12 11 L14.5 13.5'] as const

/**
 * Archive ↔ restore. The lid lifts off the box as the arrow inside turns to
 * point out of it; archiving again turns the arrow back in and the lid comes
 * down on it. `active` = restore.
 */
export const ArchiveRestoreIcon = createIcon({
  name: 'archive-restore',
  category: 'files',
  keywords: ['archive', 'unarchive', 'restore', 'move to archive', 'box', 'storage', 'recover'],
  states: ['archive', 'restore'],
  variants: (k) => {
    const lift = { y: [null, -1.5, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized']) }
    return {
      lid: { rest: lift, active: lift },
      head: {
        rest: { d: HEAD[0], transition: k.tween('base', 'emphasized') },
        active: { d: HEAD[1], transition: k.tween('base', 'emphasized') },
      },
    }
  },
  render: (v) => (
    <>
      <path d="M5 8.5 V18.5 A2 2 0 0 0 7 20.5 H17 A2 2 0 0 0 19 18.5 V8.5" />
      <path d="M12 11 V17" />
      <m.path d={HEAD[0]} variants={v.head} />
      <m.g variants={v.lid}>
        <rect x="3" y="3.5" width="18" height="5" rx="2" />
      </m.g>
    </>
  ),
})
