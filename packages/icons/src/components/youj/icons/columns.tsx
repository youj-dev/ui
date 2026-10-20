import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* Two dividers that lie on top of each other at the center while there are
 * two columns, and part to the thirds for three. */
const CENTRE = 'M12 3 L12 21'
const THIRDS = ['M9 3 L9 21', 'M15 3 L15 21'] as const

/**
 * Two ↔ three columns. The center divider splits in two and the halves
 * slide out to the thirds; merging draws them back into one.
 * `active` = three columns.
 */
export const ColumnsIcon = createIcon({
  name: 'columns',
  category: 'editor',
  keywords: ['columns', 'layout', 'split', 'grid', 'table', 'side by side', 'sections'],
  states: ['2 columns', '3 columns'],
  variants: (k) => ({
    left: { rest: { d: CENTRE, transition: k.spring('smooth') }, active: { d: THIRDS[0], transition: k.spring('smooth') } },
    right: { rest: { d: CENTRE, transition: k.spring('smooth') }, active: { d: THIRDS[1], transition: k.spring('smooth') } },
  }),
  render: (v) => (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <m.path d={CENTRE} variants={v.left} />
      <m.path d={CENTRE} variants={v.right} />
    </>
  ),
})
