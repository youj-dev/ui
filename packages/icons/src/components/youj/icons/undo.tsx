import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

/* A 90° head with 5-unit arms, as on corner-down-left, and a hook that turns
 * on a 4.75 radius and runs back out under the head. */
const HEAD = 'M9 15 L4 10 L9 5'
const HOOK = 'M4 10 H13.5 A4.75 4.75 0 0 1 13.5 19.5 H8'

/**
 * Undo ↔ redo. The arrow turns over like a card on its vertical axis, so the
 * head and the hook trade sides; holding Shift in an editor is the natural
 * trigger. Toggling mid-turn turns it back. `active` = redo.
 */
export const UndoIcon = createIcon({
  name: 'undo',
  category: 'arrows',
  keywords: ['back', 'revert', 'history', 'step back', 'redo', 'ctrl z'],
  states: ['undo', 'redo'],
  variants: (k) => ({
    arrow: {
      rest: { scaleX: 1, transition: k.spring('snappy') },
      active: { scaleX: -1, transition: k.spring('snappy') },
    },
  }),
  render: (v) => (
    <m.g variants={v.arrow} style={origin(12, 12)}>
      <path d={HEAD} />
      <path d={HOOK} />
    </m.g>
  ),
})
