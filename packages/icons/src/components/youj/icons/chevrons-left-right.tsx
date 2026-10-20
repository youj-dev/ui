import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* chevrons-up-down turned a quarter. Each chevron keeps its wing tips' y and
 * trades the apex's x with the wings', so it folds through a flat line and
 * turns inside out. */
const LEFT = ['M9 17 L4 12 L9 7', 'M4 17 L9 12 L4 7'] as const
const RIGHT = ['M15 17 L20 12 L15 7', 'M20 17 L15 12 L20 7'] as const

/**
 * Widen ↔ narrow, for resizable columns and panels that expand sideways. Both
 * chevrons fold flat and turn inside out, so outward becomes inward;
 * toggling mid-fold unfolds them again. `active` = expanded.
 */
export const ChevronsLeftRightIcon = createIcon({
  name: 'chevrons-left-right',
  category: 'arrows',
  keywords: ['expand', 'collapse', 'widen', 'narrow', 'horizontal', 'width', 'resize', 'column', 'stretch'],
  states: ['collapsed', 'expanded'],
  variants: (k) => ({
    left: {
      rest: { d: LEFT[0], transition: k.spring('snappy') },
      active: { d: LEFT[1], transition: k.spring('snappy') },
    },
    right: {
      rest: { d: RIGHT[0], transition: k.spring('snappy') },
      active: { d: RIGHT[1], transition: k.spring('snappy') },
    },
  }),
  render: (v) => (
    <>
      <m.path d={LEFT[0]} variants={v.left} />
      <m.path d={RIGHT[0]} variants={v.right} />
    </>
  ),
})
