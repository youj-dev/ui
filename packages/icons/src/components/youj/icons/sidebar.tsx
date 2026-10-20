import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* The divider and the chevron share one command structure (three points), so
 * the divider pulls free of the frame's edges and bends into the chevron. */
const DIVIDER = 'M9 3 L9 12 L9 21'
const CHEVRON = 'M7 8.5 L10.5 12 L7 15.5'

/**
 * Sidebar open ↔ closed. The panel's divider pulls free of the frame and folds
 * into a chevron pointing where the sidebar will come back from; opening
 * unfolds it into the divider again. `active` = closed.
 */
export const SidebarIcon = createIcon({
  name: 'sidebar',
  category: 'navigation',
  keywords: ['panel', 'sidebar', 'collapse', 'expand', 'drawer', 'layout', 'toggle', 'panel-left', 'panel left'],
  states: ['open', 'closed'],
  variants: (k) => ({
    divider: {
      rest: { d: DIVIDER, transition: k.spring('snappy') },
      active: { d: CHEVRON, transition: k.spring('snappy') },
    },
  }),
  render: (v) => (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <m.path d={DIVIDER} variants={v.divider} />
    </>
  ),
})
