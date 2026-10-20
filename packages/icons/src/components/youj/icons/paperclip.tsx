import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* One wire on exact 45° legs: a tight r2 turn, an r4 turn at the top and an
 * outer r6 turn concentric with the first. */
const WIRE =
  'M14.36 7.47 L8 13.83 A2 2 0 0 0 10.83 16.66 L17.9 9.59 A4 4 0 0 0 12.24 3.93 L5.17 11 A6 6 0 0 0 13.66 19.49 L20.73 12.42'

/** Attach. The outer loop unwinds back along the wire and is bent round again, as if clipping onto a sheet. */
export const PaperclipIcon = createIcon({
  name: 'paperclip',
  category: 'editor',
  keywords: ['attach', 'attachment', 'file', 'clip', 'upload', 'add file'],
  variants: (k) => ({
    wire: {
      rest: { pathLength: 1, transition: k.tween('fast') },
      active: { pathLength: [null, 0.4, 1], transition: seq(k, 'deliberate', [0, 0.4, 1], ['exit', 'emphasized']) },
    },
  }),
  render: (v) => <m.path d={WIRE} variants={v.wire} />,
})
