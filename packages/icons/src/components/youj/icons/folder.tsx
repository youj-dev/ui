import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* The back (tab, top edge, upper right side) never moves. The front panel is one
 * path in both states: a rounded rectangle when closed, a forward-leaning
 * parallelogram when open. Its bottom-left corner is the hinge and stays put. */
const BACK = 'M3 17.5 V6.5 A2 2 0 0 1 5 4.5 H8.5 L10.5 6.5 H19 A2 2 0 0 1 21 8.5 V10'
const CLOSED = 'M3 6.5 L19 6.5 A2 2 0 0 1 21 8.5 L21 17.5 A2 2 0 0 1 19 19.5 L5 19.5 A2 2 0 0 1 3 17.5 Z'
const OPEN = 'M6 11 L19.33 11 A2 2 0 0 1 21.25 13.56 L19.92 18.06 A2 2 0 0 1 18 19.5 L5 19.5 A2 2 0 0 1 3 17.5 Z'

/** Closed ↔ open. The front panel tips forward on its hinge and the back of the folder shows above it. `active` = open. */
export const FolderIcon = createIcon({
  name: 'folder',
  category: 'files',
  keywords: ['directory', 'files', 'open', 'browse', 'project', 'collection'],
  states: ['closed', 'open'],
  variants: (k) => ({
    front: {
      rest: { d: CLOSED, transition: k.spring('snappy') },
      active: { d: OPEN, transition: k.spring('smooth') },
    },
  }),
  render: (v) => (
    <>
      <path d={BACK} />
      <m.path d={CLOSED} variants={v.front} />
    </>
  ),
})
