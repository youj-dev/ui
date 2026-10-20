import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The lens looks through the folder, to one side and the other, and returns to the middle. */
export const FolderSearchIcon = createIcon({
  name: 'folder-search',
  category: 'files',
  keywords: ['find folder', 'search files', 'browse', 'explore', 'lookup', 'directory search'],
  variants: (k) => ({
    lens: {
      rest: { x: 0, y: 0, transition: k.tween('fast') },
      active: { x: [0, -2, 2, 0], y: [0, 0.5, -0.5, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.65, 1]) },
    },
  }),
  render: (v) => (
    <>
      <path d="M3 17.5 V6.5 A2 2 0 0 1 5 4.5 H8.5 L10.5 6.5 H19 A2 2 0 0 1 21 8.5 V17.5 A2 2 0 0 1 19 19.5 H5 A2 2 0 0 1 3 17.5 Z" />
      <m.g variants={v.lens}>
        <circle cx="11.5" cy="12.5" r="2.5" />
        <path d="M13.3 14.3 L15.25 16.25" />
      </m.g>
    </>
  ),
})
