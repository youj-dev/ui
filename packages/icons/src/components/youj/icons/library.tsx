import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** The leaning book straightens up against the others and tips back to rest. */
export const LibraryIcon = createIcon({
  name: 'library',
  category: 'files',
  keywords: ['books', 'bookshelf', 'collection', 'catalogue', 'archive', 'resources'],
  variants: (k) => ({
    lean: {
      rest: { rotate: -12, transition: k.spring('settle') },
      active: { rotate: [-12, 0, 0, -12], transition: seq(k, 'deliberate', [0, 0.35, 0.6, 1], ['emphasized', 'linear', 'standard']) },
    },
  }),
  render: (v) => (
    <>
      <rect x="3" y="4" width="4" height="16" rx="1" />
      <rect x="8.5" y="6.5" width="4" height="13.5" rx="1" />
      <m.rect x="16.5" y="5.5" width="4" height="14.5" rx="1" variants={v.lean} style={origin(20.5, 20)} />
    </>
  ),
})
