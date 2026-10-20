import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/** The check is drawn onto the folder again, stroke by stroke, like marking it done. */
export const FolderCheckIcon = createIcon({
  name: 'folder-check',
  category: 'files',
  keywords: ['folder done', 'approved', 'synced folder', 'complete', 'verified', 'shared'],
  variants: (k) => ({
    mark: { rest: drawn(k), active: drawIn(k, 'slow', k.stagger('base'), 'emphasized') },
  }),
  render: (v) => (
    <>
      <path d="M3 17.5 V6.5 A2 2 0 0 1 5 4.5 H8.5 L10.5 6.5 H19 A2 2 0 0 1 21 8.5 V17.5 A2 2 0 0 1 19 19.5 H5 A2 2 0 0 1 3 17.5 Z" />
      <m.path d="M9 12.75 L11 14.75 L15 10.75" variants={v.mark} />
    </>
  ),
})
