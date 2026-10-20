import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* The upright waits folded into the bar's center, a point on the bar, so
 * nothing extra shows while it is a minus. */
const FOLDED = 'M12 11.99 L12 12.01'
const UPRIGHT = 'M12 5 L12 19'

/**
 * Minus ↔ plus, for steppers, accordions and zoom. An upright grows out of
 * the bar's center in both directions at once; collapsing folds it back into
 * the bar. `active` = plus.
 */
export const MinusIcon = createIcon({
  name: 'minus',
  category: 'actions',
  keywords: ['minus', 'subtract', 'remove', 'decrease', 'collapse', 'expand', 'plus'],
  states: ['minus', 'plus'],
  variants: (k) => ({
    upright: {
      rest: { d: FOLDED, transition: k.tween('base', 'emphasized') },
      active: { d: UPRIGHT, transition: k.spring('snappy') },
    },
  }),
  render: (v) => (
    <>
      <path d="M5 12 H19" />
      <m.path d={FOLDED} variants={v.upright} />
    </>
  ),
})
