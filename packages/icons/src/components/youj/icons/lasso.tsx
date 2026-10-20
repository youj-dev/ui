import { m } from 'motion/react'
import { createIcon, seqFor } from './icon-base'

/** Freeform select: the dashed loop marches round like a live selection. */
export const LassoIcon = createIcon({
  name: 'lasso',
  category: 'editor',
  keywords: ['lasso select', 'selection', 'freeform', 'marquee', 'select tool', 'crop'],
  variants: (k) => ({
    loop: {
      rest: { strokeDashoffset: 0, transition: k.tween('fast') },
      active: { strokeDashoffset: -18, transition: seqFor(k, k.duration('deliberate') * 2, [0, 1], ['linear']) },
    },
  }),
  render: (v) => (
    <>
      <m.path
        d="M8 13.6 C5.6 12.8 4 11.2 4 9.25 C4 6.35 7.6 4 12 4 C16.4 4 20 6.35 20 9.25 C20 12.15 16.4 14.5 12 14.5 C11.1 14.5 10.2 14.4 9.4 14.2"
        strokeDasharray="1.5 3"
        variants={v.loop}
      />
      <circle cx="7.75" cy="15.75" r="1.5" />
      <path d="M7.25 17.25 C7.25 18.75 6.5 19.75 5 20.75" />
    </>
  ),
})
