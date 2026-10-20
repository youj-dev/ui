import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* A 16-unit box with 2.5-unit corners whose top-right corner is the arrow:
 * the head's two arms sit on the box's edges, so at rest the arrow completes
 * the box, and when it leaves the corner stands open. */

/** Open in a new tab. The arrow leaves through the box's open corner and a fresh one slides out of the box after it. */
export const ExternalLinkIcon = createIcon({
  name: 'external-link',
  category: 'arrows',
  keywords: ['open', 'new tab', 'new window', 'launch', 'outside', 'link', 'square-arrow-out-up-right'],
  variants: (k) => ({
    arrow: {
      rest: { x: 0, y: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        x: [null, 5, -4, 0],
        y: [null, -5, 4, 0],
        opacity: [null, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.36, 0.37, 1], ['exit', 'linear', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    <>
      <path d="M11 4 H6.5 A2.5 2.5 0 0 0 4 6.5 V17.5 A2.5 2.5 0 0 0 6.5 20 H17.5 A2.5 2.5 0 0 0 20 17.5 V13" />
      <m.g variants={v.arrow}>
        <path d="M11 13 L20 4" />
        <path d="M15 4 H20 V9" />
      </m.g>
    </>
  ),
})
