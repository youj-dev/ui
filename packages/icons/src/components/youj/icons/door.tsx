import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* A tall, narrow doorway (9 × 17, 1.5-unit top corners) on a 15-unit sill.
 * The panel is the doorway's own outline (lines and cubic top corners), so
 * while closed it lies exactly on the frame. Opening swings it toward you on
 * its left hinge: the free edge moves in and stands a little taller, and the
 * far corner folds into the top edge. */
const CLOSED = 'M7.5 20.5 L7.5 5 C7.5 4.17 8.17 3.5 9 3.5 L15 3.5 C15.83 3.5 16.5 4.17 16.5 5 L16.5 20.5'
const OPEN = 'M7.5 20.5 L7.5 5 C7.5 4.17 8.17 3.5 9 3.5 L12 3 C12 3 12 3 12 3 L12 21'

/**
 * Closed ↔ open, for rooms, exits and access. The door swings in on its
 * hinge and its handle travels with the free edge, leaving the doorway open;
 * closing swings it back flush with the frame. `active` = open.
 */
export const DoorIcon = createIcon({
  name: 'door',
  category: 'navigation',
  keywords: ['door', 'exit', 'enter', 'room', 'leave', 'access', 'open', 'smart home', 'door-open', 'door-closed'],
  states: ['closed', 'open'],
  variants: (k) => ({
    panel: {
      rest: { d: CLOSED, transition: k.spring('snappy') },
      active: { d: OPEN, transition: k.spring('smooth') },
    },
    handle: {
      rest: { x: 0, transition: k.spring('snappy') },
      active: { x: -4, transition: k.spring('smooth') },
    },
  }),
  render: (v) => (
    <>
      <path d="M7.5 20.5 V5 A1.5 1.5 0 0 1 9 3.5 H15 A1.5 1.5 0 0 1 16.5 5 V20.5" />
      <path d="M4.5 20.5 H19.5" />
      <m.path d={CLOSED} variants={v.panel} />
      <m.path d="M14.5 12.5 h.01" strokeWidth={2} variants={v.handle} />
    </>
  ),
})
