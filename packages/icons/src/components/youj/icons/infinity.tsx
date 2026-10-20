import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/** The loop is traced again from its crossing, round both sides and back. */
export const InfinityIcon = createIcon({
  name: 'infinity',
  category: 'data',
  keywords: ['infinite', 'unlimited', 'forever', 'loop', 'endless', 'continuous'],
  variants: (k) => ({
    loop: { rest: drawn(k), active: drawIn(k, 'deliberate', 0, 'standard') },
  }),
  render: (v) => (
    <m.path
      d="M12 12 C10.25 9.4 8.75 8 6.75 8 A4 4 0 0 0 6.75 16 C8.75 16 10.25 14.6 12 12 C13.75 9.4 15.25 8 17.25 8 A4 4 0 0 1 17.25 16 C15.25 16 13.75 14.6 12 12"
      variants={v.loop}
    />
  ),
})
