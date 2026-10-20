import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* table's landscape sheet (18 × 16). Three rows at rest, four when compact.
 * The first divider carries a second one on top of it, which peels off to
 * the middle as both outer dividers move out to the quarters. */
const ROWS = {
  top: ['M3 9.5 L21 9.5', 'M3 8 L21 8'],
  peel: ['M3 9.5 L21 9.5', 'M3 12 L21 12'],
  bottom: ['M3 14.5 L21 14.5', 'M3 16 L21 16'],
} as const

/**
 * Comfortable ↔ compact, for table and list density. The rows close up as a
 * new divider peels off the first and settles in the middle; relaxing
 * folds it back and the rows open out. `active` = compact.
 */
export const RowsIcon = createIcon({
  name: 'rows',
  category: 'editor',
  keywords: ['density', 'rows', 'compact', 'comfortable', 'standard', 'table', 'spacing', 'list', 'layout', 'rows-3', 'rows-4'],
  states: ['comfortable', 'compact'],
  variants: (k) => {
    const line = ([rest, active]: readonly [string, string]) => ({
      rest: { d: rest, transition: k.spring('smooth') },
      active: { d: active, transition: k.spring('smooth') },
    })
    return {
      top: line(ROWS.top),
      peel: {
        rest: { d: ROWS.peel[0], transition: k.tween('base', 'emphasized') },
        active: { d: ROWS.peel[1], transition: { ...k.spring('smooth'), delay: k.stagger('base') } },
      },
      bottom: line(ROWS.bottom),
    }
  },
  render: (v) => (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <m.path d={ROWS.top[0]} variants={v.top} />
      <m.path d={ROWS.peel[0]} variants={v.peel} />
      <m.path d={ROWS.bottom[0]} variants={v.bottom} />
    </>
  ),
})
