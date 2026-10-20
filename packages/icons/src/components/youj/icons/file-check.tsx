import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/** The check is drawn onto the page again, stroke by stroke, like signing it off. */
export const FileCheckIcon = createIcon({
  name: 'file-check',
  category: 'files',
  keywords: ['approved', 'verified', 'done', 'document check', 'complete', 'reviewed'],
  variants: (k) => ({
    mark: { rest: drawn(k), active: drawIn(k, 'slow', k.stagger('base'), 'emphasized') },
  }),
  render: (v) => (
    <>
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      <m.path d="M9 14.5 L11 16.5 L15 12.5" variants={v.mark} />
    </>
  ),
})
