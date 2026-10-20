import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* Up and down share one command structure: the shaft's ends trade places and
 * the head's apex runs the length of the shaft, so half-way the arrow is a flat
 * bar, the neutral "unsorted" pose. */
const UP = 'M12 19 L12 5 M6 11 L12 5 L18 11'
const DOWN = 'M12 5 L12 19 M6 13 L12 19 L18 13'

/**
 * Up ↔ down, for sort direction and show more / less. The arrow folds flat
 * through its center and unfolds the other way; toggling mid-fold turns it
 * straight back. `active` = down.
 */
export const ArrowUpIcon = createIcon({
  name: 'arrow-up',
  category: 'arrows',
  keywords: ['up', 'ascending', 'descending', 'sort', 'order', 'top', 'down', 'toggle'],
  states: ['up', 'down'],
  variants: (k) => ({
    arrow: {
      rest: { d: UP, transition: k.spring('snappy') },
      active: { d: DOWN, transition: k.spring('snappy') },
    },
  }),
  render: (v) => <m.path d={UP} variants={v.arrow} />,
})
