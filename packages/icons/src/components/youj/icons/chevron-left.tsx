import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/**
 * The mirror of chevron-right, for trees read right to left and back panels.
 * `active` = expanded: the chevron turns a quarter counter-clockwise to point
 * down into the opened branch.
 */
export const ChevronLeftIcon = createIcon({
  name: 'chevron-left',
  category: 'arrows',
  keywords: ['back', 'previous', 'prev', 'left', 'expand', 'collapse', 'disclosure', 'tree', 'rtl'],
  states: ['collapsed', 'expanded'],
  variants: (k) => ({
    chevron: {
      rest: { rotate: 0, transition: k.spring('snappy') },
      active: { rotate: -90, transition: k.spring('snappy') },
    },
  }),
  render: (v) => <m.path d="M15 6 L9 12 L15 18" variants={v.chevron} style={origin(12, 12)} />,
})
