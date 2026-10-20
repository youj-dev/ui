import { m } from 'motion/react'
import { createIcon, origin } from './icon-base'

const FIRST = 'M2.5 12.5 L6.75 16.75 L16.25 7.25'
/* The second tick waits exactly under the first's lower half. A mask cut
 * along the first tick's long arm hides its short arm where it would cross,
 * the way one tick tucks behind the other. */
const SECOND = 'M5 15 L6.75 16.75 L16.25 7.25'

/**
 * Sent ↔ read. A second tick slides out from under the first and lands
 * beside it with a settle, its short arm tucked behind the long one; marking
 * as unread slides it back under. `active` = read.
 */
export const CheckCheckIcon = createIcon({
  name: 'check-check',
  category: 'communication',
  keywords: ['read', 'seen', 'delivered', 'double check', 'receipt', 'message', 'done'],
  states: ['sent', 'read'],
  variants: (k) => ({
    second: {
      rest: { x: 0, transition: k.tween('base', 'emphasized') },
      active: { x: 5.25, transition: { ...k.spring('settle'), delay: k.duration('instant') } },
    },
  }),
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <path d="M6.75 16.75 L16.25 7.25" stroke="black" strokeWidth={4.5} />
      </mask>
      <path d={FIRST} />
      <g mask={`url(#${id}-m)`}>
        <m.path d={SECOND} variants={v.second} style={origin(12, 12)} />
      </g>
    </>
  ),
})
