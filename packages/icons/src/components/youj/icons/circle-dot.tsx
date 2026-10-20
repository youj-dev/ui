import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Selected. The center dot presses in and swells back to full, like a radio being chosen; the ring holds still. */
export const CircleDotIcon = createIcon({
  name: 'circle-dot',
  category: 'status',
  keywords: ['radio', 'selected', 'option', 'dot-circle', 'record', 'in progress', 'active', 'point'],
  variants: (k) => ({
    dot: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [null, 0.5, 1], transition: seq(k, 'slow', [0, 0.38, 1], ['exit', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <m.circle cx="12" cy="12" r="3.25" fill="currentColor" stroke="none" variants={v.dot} style={origin(12, 12)} />
    </>
  ),
})
