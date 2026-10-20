import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** The lens sweeps back along the lines it is reading and returns to its place. */
export const TextSearchIcon = createIcon({
  name: 'text-search',
  category: 'navigation',
  keywords: ['find in page', 'search text', 'lookup', 'find', 'document search', 'grep'],
  variants: (k) => ({
    lens: {
      rest: { x: 0, y: 0, transition: k.tween('fast') },
      active: { x: [0, -6, -6, 0], y: [0, -1, -1, 0], transition: seq(k, 'deliberate', [0, 0.4, 0.55, 1], ['standard', 'linear', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <path d="M3.5 5.5 H20.5" />
      <path d="M3.5 11 H9" />
      <path d="M3.5 16.5 H7.5" />
      <m.g variants={v.lens}>
        <circle cx="15" cy="14" r="3.5" />
        <path d="M17.5 16.5 L20 19" />
      </m.g>
    </>
  ),
})
