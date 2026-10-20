import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* folder's open pose: the same back, and the front panel tipped forward on
 * its bottom-left hinge. */
const BACK = 'M3 17.5 V6.5 A2 2 0 0 1 5 4.5 H8.5 L10.5 6.5 H19 A2 2 0 0 1 21 8.5 V10'
const FRONT = 'M6 11 L19.33 11 A2 2 0 0 1 21.25 13.56 L19.92 18.06 A2 2 0 0 1 18 19.5 L5 19.5 A2 2 0 0 1 3 17.5 Z'

/** Open. The front panel tips a little further on its hinge, as if leafing through, and settles back. */
export const FolderOpenIcon = createIcon({
  name: 'folder-open',
  category: 'files',
  keywords: ['folder', 'open', 'directory', 'browse', 'files', 'explorer', 'folder-open', 'opened'],
  variants: (k) => ({
    front: {
      rest: { scaleY: 1, skewX: 0, transition: k.tween('fast') },
      active: {
        scaleY: [null, 0.86, 1],
        skewX: [null, -9, 0],
        transition: seq(k, 'slow', [0, 0.42, 1], ['standard', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    <>
      <path d={BACK} />
      <m.path d={FRONT} variants={v.front} style={origin(3, 19.5)} />
    </>
  ),
})
