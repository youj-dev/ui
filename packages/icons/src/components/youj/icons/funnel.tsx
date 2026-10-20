import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

const FUNNEL = 'M3.5 4 H20.5 L14 12 V19 L10 21 V12 Z'

/**
 * All ↔ filtered. The funnel dips as it catches the pour and fills from the
 * rim down into the stem; clearing the filter drains it back up and out.
 * `active` = filtered.
 */
export const FunnelIcon = createIcon({
  name: 'funnel',
  category: 'actions',
  keywords: ['filter', 'filtered', 'refine', 'narrow', 'query', 'conversion', 'active filter'],
  states: ['all', 'filtered'],
  variants: (k) => ({
    funnel: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, 0.75, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    fill: {
      rest: { clipPath: 'inset(0% 0% 100% 0%)', transition: k.tween('base', 'exit') },
      active: { clipPath: 'inset(0% 0% 0% 0%)', transition: { ...k.tween('slow', 'emphasized'), delay: k.duration('instant') } },
    },
  }),
  render: (v) => (
    <m.g variants={v.funnel}>
      <m.path d={FUNNEL} fill="currentColor" stroke="none" variants={v.fill} />
      <path d={FUNNEL} />
    </m.g>
  ),
})
