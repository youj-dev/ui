import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The shackle on the page lifts to check the lock and drops back shut. */
export const FileLockIcon = createIcon({
  name: 'file-lock',
  category: 'files',
  keywords: ['private file', 'encrypted', 'protected document', 'secure', 'confidential', 'locked'],
  variants: (k) => ({
    shackle: {
      rest: { y: 0, transition: k.spring('snappy') },
      active: { y: [0, -1.25, -1.25, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.6, 1], ['emphasized', 'linear', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      <rect x="9" y="13.5" width="6" height="4.5" rx="1" />
      <m.path d="M10.5 13.5 V12.25 A1.5 1.5 0 0 1 13.5 12.25 V13.5" variants={v.shackle} />
    </>
  ),
})
