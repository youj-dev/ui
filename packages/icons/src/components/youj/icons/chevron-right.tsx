import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/** Tree disclosure. `active` = expanded: the chevron turns a quarter clockwise to point down into the opened branch. */
export const ChevronRightIcon = createIcon({
  name: 'chevron-right',
  category: 'arrows',
  keywords: ['expand', 'collapse', 'disclosure', 'tree', 'next', 'more'],
  states: ['collapsed', 'expanded'],
  variants: (k) => ({
    chevron: {
      rest: { rotate: 0, transition: k.spring('snappy') },
      active: { rotate: 90, transition: k.spring('snappy') },
    },
  }),
  render: (v) => <m.path d="M9 6 L15 12 L9 18" variants={v.chevron} style={origin(12, 12)} />,
})
