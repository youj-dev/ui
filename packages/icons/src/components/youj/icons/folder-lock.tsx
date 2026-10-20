import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The shackle on the folder lifts to check the lock and drops back shut. */
export const FolderLockIcon = createIcon({
  name: 'folder-lock',
  category: 'files',
  keywords: ['private folder', 'secure', 'protected', 'vault', 'encrypted', 'locked'],
  variants: (k) => ({
    shackle: {
      rest: { y: 0, transition: k.spring('snappy') },
      active: { y: [0, -1.25, -1.25, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.6, 1], ['emphasized', 'linear', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <path d="M3 17.5 V6.5 A2 2 0 0 1 5 4.5 H8.5 L10.5 6.5 H19 A2 2 0 0 1 21 8.5 V17.5 A2 2 0 0 1 19 19.5 H5 A2 2 0 0 1 3 17.5 Z" />
      <rect x="9.5" y="12.5" width="5" height="4" rx="1" />
      <m.path d="M10.75 12.5 V11.25 A1.25 1.25 0 0 1 13.25 11.25 V12.5" variants={v.shackle} />
    </>
  ),
})
