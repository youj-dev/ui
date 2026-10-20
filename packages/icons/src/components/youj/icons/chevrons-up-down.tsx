import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* Each chevron keeps its wing tips' x and trades the apex's height with the
 * wings', so it folds through a flat line and turns inside out. */
const TOP = ['M7 9 L12 4 L17 9', 'M7 4 L12 9 L17 4'] as const
const BOTTOM = ['M7 15 L12 20 L17 15', 'M7 20 L12 15 L17 20'] as const

/**
 * Expand ↔ collapse, for selects and expand-all toggles. Both chevrons fold
 * flat and turn inside out, so up-down becomes down-up; toggling mid-fold
 * unfolds them again. `active` = expanded.
 */
export const ChevronsUpDownIcon = createIcon({
  name: 'chevrons-up-down',
  category: 'arrows',
  keywords: ['select', 'dropdown', 'combobox', 'expand all', 'collapse all', 'sort'],
  states: ['collapsed', 'expanded'],
  variants: (k) => ({
    top: {
      rest: { d: TOP[0], transition: k.spring('snappy') },
      active: { d: TOP[1], transition: k.spring('snappy') },
    },
    bottom: {
      rest: { d: BOTTOM[0], transition: k.spring('snappy') },
      active: { d: BOTTOM[1], transition: k.spring('snappy') },
    },
  }),
  render: (v) => (
    <>
      <m.path d={TOP[0]} variants={v.top} />
      <m.path d={BOTTOM[0]} variants={v.bottom} />
    </>
  ),
})
