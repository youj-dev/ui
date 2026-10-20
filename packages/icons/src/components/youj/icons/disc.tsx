import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/* Two glints on opposite sides of the r5.5 track, so the disc looks the same
 * every half turn and rest can sit at 180°. */
const GLINTS = 'M6.5 12 A5.5 5.5 0 0 1 9.25 7.24 M17.5 12 A5.5 5.5 0 0 1 14.75 16.76'

/** Spinning up: the disc turns half a revolution under its glints, fast off the mark and coasting to a stop. */
export const DiscIcon = createIcon({
  name: 'disc',
  category: 'media',
  keywords: ['disc', 'cd', 'vinyl', 'album', 'music', 'record', 'dvd', 'media'],
  variants: (k) => ({
    glints: {
      rest: { rotate: 180, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 180], transition: k.tween('deliberate', 'enter') },
    },
  }),
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2" />
      <m.path d={GLINTS} variants={v.glints} style={origin(12, 12)} />
    </>
  ),
})
