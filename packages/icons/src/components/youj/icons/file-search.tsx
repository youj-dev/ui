import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The lens looks over the page, down one side and back, and returns to the middle. */
export const FileSearchIcon = createIcon({
  name: 'file-search',
  category: 'files',
  keywords: ['find file', 'search documents', 'lookup', 'browse files', 'preview', 'inspect'],
  variants: (k) => ({
    lens: {
      rest: { x: 0, y: 0, transition: k.tween('fast') },
      active: { x: [0, -1.5, 1.5, 0], y: [0, -1.5, 1, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.65, 1]) },
    },
  }),
  render: (v) => (
    <>
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      <m.g variants={v.lens}>
        <circle cx="11.5" cy="14" r="2.5" />
        <path d="M13.3 15.8 L15.25 17.75" />
      </m.g>
    </>
  ),
})
