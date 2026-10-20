import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/** Plus ↔ close. A quarter-and-an-eighth turn; the cross lands as an ×. */
export const PlusIcon = createIcon({
  name: 'plus',
  category: 'actions',
  keywords: ['add', 'new', 'create', 'close', 'x'],
  states: ['plus', 'close'],
  variants: (k) => ({
    cross: {
      rest: { rotate: 0, transition: k.spring('snappy') },
      active: { rotate: 135, transition: k.spring('snappy') },
    },
  }),
  render: (v) => (
    <m.g variants={v.cross} style={origin(12, 12)}>
      <path d="M12 5 V19" />
      <path d="M5 12 H19" />
    </m.g>
  ),
})
