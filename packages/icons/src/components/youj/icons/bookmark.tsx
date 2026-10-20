import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

const RIBBON = 'M18 21 L12 17 L6 21 V5 A2 2 0 0 1 8 3 H16 A2 2 0 0 1 18 5 Z'

/**
 * Save ↔ saved. The ribbon gives a small tug and fills from the top down, the
 * fill landing with a settle; removing the bookmark drains it back up.
 * `active` = saved.
 */
export const BookmarkIcon = createIcon({
  name: 'bookmark',
  category: 'navigation',
  keywords: ['save', 'saved', 'favorite', 'read later', 'pin', 'collection'],
  states: ['unsaved', 'saved'],
  variants: (k) => ({
    ribbon: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, 1.25, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    fill: {
      rest: { y: -20, transition: k.tween('base', 'exit') },
      active: { y: 0, transition: { ...k.spring('settle'), delay: k.duration('instant') } },
    },
  }),
  render: (v, { id }) => (
    <m.g variants={v.ribbon}>
      <clipPath id={`${id}-c`}>
        <path d={RIBBON} />
      </clipPath>
      <g clipPath={`url(#${id}-c)`}>
        <m.g variants={v.fill}>
          <rect x="5" y="2" width="14" height="20" fill="currentColor" stroke="none" />
        </m.g>
      </g>
      <path d={RIBBON} />
    </m.g>
  ),
})
