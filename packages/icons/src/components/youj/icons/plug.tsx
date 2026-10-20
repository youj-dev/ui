import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* Both halves sit on the 45° axis with their faces meeting at the center.
 * The prongs belong to the plug and run into the socket; a mask that travels
 * with the socket hides whatever length is still inside it. */
const APART = 1.41

/**
 * Plugged ↔ unplugged. The halves pull apart along their axis and the prongs
 * slide out of the socket into view; plugging back in pushes them home.
 * `active` = unplugged.
 */
export const PlugIcon = createIcon({
  name: 'plug',
  category: 'development',
  keywords: ['connect', 'integration', 'disconnect', 'unplug', 'connector', 'power', 'plugin'],
  states: ['plugged', 'unplugged'],
  variants: (k) => {
    const half = (dir: 1 | -1) => ({
      rest: { x: 0, y: 0, transition: k.tween('base', 'enter') },
      active: { x: APART * dir, y: -APART * dir, transition: k.tween('slow', 'emphasized') },
    })
    return { socket: half(1), plug: half(-1) }
  },
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.path d="M7.76 7.76 L16.24 -0.73 L24.73 7.76 L16.24 16.24 Z" fill="black" stroke="none" variants={v.socket} />
      </mask>
      <m.g variants={v.socket}>
        <path d="M9.35 9.35 L11.82 6.87 A2 2 0 0 1 14.65 6.87 L17.13 9.35 A2 2 0 0 1 17.13 12.18 L14.65 14.65 Z" />
        <path d="M15.89 8.11 L19.07 4.93" />
      </m.g>
      <m.g variants={v.plug}>
        <path d="M9.35 9.35 L6.87 11.82 A2 2 0 0 0 6.87 14.65 L9.35 17.13 A2 2 0 0 0 12.18 17.13 L14.65 14.65 Z" />
        <path d="M8.11 15.89 L4.93 19.07" />
      </m.g>
      <g mask={`url(#${id}-m)`}>
        <m.g variants={v.plug}>
          <path d="M13.06 13.06 L14.83 11.29" />
          <path d="M10.94 10.94 L12.71 9.17" />
        </m.g>
      </g>
    </>
  ),
})
