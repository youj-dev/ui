import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* rows' landscape sheet with a single divider: the comfortable end of the
 * density scale (rows-2, rows, rows active = 2, 3 and 4 rows). Two dividers
 * lie on top of each other at rest. */
const DIVIDER = 'M3 12 H21'

/**
 * Comfortable rows. The divider splits into the two of the standard layout
 * and they fold back together, so the rows settle open again.
 */
export const Rows2Icon = createIcon({
  name: 'rows-2',
  category: 'editor',
  keywords: ['density', 'comfortable', 'rows', 'relaxed', 'spacious', 'table', 'list', 'spacing', 'two rows'],
  variants: (k) => {
    const split = (dy: number) => ({
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, dy, 0], transition: seq(k, 'deliberate', [0, 0.35, 1], ['standard', 'emphasized']) },
    })
    return { up: split(-2.5), down: split(2.5) }
  },
  render: (v) => (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <m.path d={DIVIDER} variants={v.up} />
      <m.path d={DIVIDER} variants={v.down} />
    </>
  ),
})
