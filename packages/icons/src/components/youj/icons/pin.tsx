import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/**
 * Unpinned ↔ pinned. The tilted pin swings upright, then drives down into the
 * board with a short press; unpinning pops it back out at an angle.
 * `active` = pinned.
 */
export const PinIcon = createIcon({
  name: 'pin',
  category: 'system',
  keywords: ['pushpin', 'pinned', 'keep', 'stick', 'favorite', 'attach'],
  states: ['unpinned', 'pinned'],
  variants: (k) => ({
    pin: {
      rest: {
        rotate: 45,
        y: [null, -1, 0],
        transition: { rotate: k.spring('snappy'), y: seq(k, 'base', [0, 0.4, 1], ['exit', 'emphasized']) },
      },
      active: {
        rotate: 0,
        y: [null, 0, 1.5, 0],
        transition: { rotate: k.spring('snappy'), y: seq(k, 'slow', [0, 0.45, 0.65, 1], ['linear', 'exit', 'emphasized']) },
      },
    },
  }),
  render: (v) => (
    <m.g variants={v.pin} style={origin(12, 12.25)}>
      <path d="M8.5 3.5 H15.5" />
      <path d="M10 3.5 V9 L7 12 V13.5 H17 V12 L14 9 V3.5" />
      <path d="M12 13.5 V21" />
    </m.g>
  ),
})
