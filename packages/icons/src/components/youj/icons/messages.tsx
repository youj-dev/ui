import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

const FRONT =
  'M3 5 A2 2 0 0 1 5 3 H14 A2 2 0 0 1 16 5 V11 A2 2 0 0 1 14 13 H9.5 L6 16 V13 H5 A2 2 0 0 1 3 11 Z'
const BACK = 'M12.5 8 H19 A2 2 0 0 1 21 10 V16 A2 2 0 0 1 19 18 H18 V21 L14.5 18 H12.5 A2 2 0 0 1 10.5 16 V10 A2 2 0 0 1 12.5 8 Z'

/**
 * A conversation: the front bubble speaks up, then the reply behind it answers.
 * The reply is a whole bubble, masked by a gap around the front one, so they
 * can move independently without ever touching.
 */
export const MessagesIcon = createIcon({
  name: 'messages',
  category: 'communication',
  keywords: ['chat', 'conversation', 'thread', 'comments', 'discussion', 'dm', 'replies'],
  variants: (k) => ({
    front: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, -1.25, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized']) },
    },
    back: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 1, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], k.stagger('loose') * 2.5) },
    },
  }),
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d={FRONT} fill="black" stroke="black" strokeWidth={4.5} variants={v.front} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <m.path d={BACK} variants={v.back} />
      </g>
      <m.path d={FRONT} variants={v.front} />
    </>
  ),
})
