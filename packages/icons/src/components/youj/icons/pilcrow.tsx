import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/** A new paragraph: the bowl of the mark is filled in again around its stems. */
export const PilcrowIcon = createIcon({
  name: 'pilcrow',
  category: 'editor',
  keywords: ['paragraph', 'pilcrow', 'formatting marks', 'text', 'show invisibles', 'line break'],
  variants: (k) => ({
    bowl: { rest: drawn(k), active: drawIn(k, 'slow', 0, 'standard') },
  }),
  render: (v) => (
    <>
      <m.path d="M13 4 H10 A4 4 0 0 0 10 12 H13" variants={v.bowl} />
      <path d="M13 4 V20" />
      <path d="M17 4 V20" />
      <path d="M13 4 H19" />
    </>
  ),
})
