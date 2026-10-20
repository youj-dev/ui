import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/** Disclosure chevron. `active` = expanded: the chevron turns over to point up. */
export const ChevronDownIcon = createIcon({
  name: 'chevron-down',
  category: 'arrows',
  keywords: ['expand', 'collapse', 'disclosure', 'accordion', 'dropdown'],
  states: ['collapsed', 'expanded'],
  variants: (k) => ({
    chevron: {
      rest: { rotate: 0, transition: k.spring('snappy') },
      active: { rotate: -180, transition: k.spring('snappy') },
    },
  }),
  render: (v) => <m.path d="M6 9 L12 15 L18 9" variants={v.chevron} style={origin(12, 12)} />,
})
