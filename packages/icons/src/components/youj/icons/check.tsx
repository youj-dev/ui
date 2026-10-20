import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, origin } from './icon-base'

/** Draws its stroke with a decisive ease-out, then settles with a tiny spring. */
export const CheckIcon = createIcon({
  name: 'check',
  category: 'actions',
  keywords: ['done', 'complete', 'confirm', 'ok', 'success', 'tick'],
  variants: (k) => ({
    mark: {
      from: { ...hidden, scale: 0.9 },
      rest: { ...drawn(k), scale: 1 },
      active: {
        ...drawIn(k, 'slow'),
        scale: [0.88, 1],
        transition: { ...drawIn(k, 'slow').transition, scale: { ...k.spring('settle'), delay: k.duration('base') } },
      },
    },
  }),
  render: (v) => <m.path d="M4 12.5 L9 17.5 L20 6.5" variants={v.mark} style={origin(12, 12)} />,
})
