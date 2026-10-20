import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* sidebar's move, turned on its side: the divider and the chevron share one
 * three-point structure, so the divider pulls free of the frame and bends
 * into a chevron pointing up, where the panel will open from. */
const DIVIDER = 'M3 15 L12 15 L21 15'
const CHEVRON = 'M8.5 18.25 L12 14.75 L15.5 18.25'

/**
 * Bottom panel open ↔ closed, for terminals, consoles and drawers. The
 * panel's divider lets go of the frame and folds into a chevron pointing up;
 * opening unfolds it back into the divider. `active` = closed.
 */
export const PanelBottomIcon = createIcon({
  name: 'panel-bottom',
  category: 'navigation',
  keywords: ['panel', 'terminal', 'console', 'drawer', 'bottom bar', 'toggle', 'layout', 'collapse'],
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
