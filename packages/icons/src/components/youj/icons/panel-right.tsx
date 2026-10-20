import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* The mirror of the sidebar: the divider and the chevron share one command
 * structure (three points), so the divider bends into the chevron. */
const DIVIDER = 'M15 3 L15 12 L15 21'
const CHEVRON = 'M17 8.5 L13.5 12 L17 15.5'

/**
 * Inspector open ↔ closed. The right panel's divider pulls free of the frame
 * and folds into a chevron pointing where the panel will slide back from;
 * opening unfolds it again. `active` = closed.
 */
export const PanelRightIcon = createIcon({
  name: 'panel-right',
  category: 'navigation',
  keywords: ['inspector', 'details', 'panel', 'aside', 'collapse', 'expand', 'layout'],
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
