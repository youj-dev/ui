import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The zip pull slides down the teeth and back up, closing the archive again. */
export const FileArchiveIcon = createIcon({
  name: 'file-archive',
  category: 'files',
  keywords: ['zip', 'compressed', 'archive file', 'package', 'bundle', 'tar'],
  variants: (k) => ({
    pull: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 2, 0], transition: seq(k, 'deliberate', [0, 0.45, 1], ['standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      <path d="M10 5.5 H11.5" />
      <path d="M11.5 7.5 H13" />
      <path d="M10 9.5 H11.5" />
      <path d="M11.5 11.5 H13" />
      <m.rect x="10" y="13.5" width="3" height="4" rx="1" variants={v.pull} />
    </>
  ),
})
