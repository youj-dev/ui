import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/**
 * Upward disclosure, the mirror of chevron-down. `active` = expanded: the
 * chevron turns over to point down, for menus that open upward (a user menu
 * at the foot of a sidebar) and show-less toggles.
 */
export const ChevronUpIcon = createIcon({
  name: 'chevron-up',
  category: 'arrows',
  keywords: ['expand', 'collapse', 'disclosure', 'dropup', 'show less', 'up', 'scroll up', 'previous'],
  states: ['collapsed', 'expanded'],
  variants: (k) => ({
    chevron: {
      rest: { rotate: 0, transition: k.spring('snappy') },
      active: { rotate: 180, transition: k.spring('snappy') },
    },
  }),
  render: (v) => <m.path d="M6 15 L12 9 L18 15" variants={v.chevron} style={origin(12, 12)} />,
})
