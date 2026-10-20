import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/**
 * Action: the clapstick snaps shut on the board with a sharp close and
 * swings back open on its hinge. Drawn shut; it rests open at −12°.
 */
export const ClapperboardIcon = createIcon({
  name: 'clapperboard',
  category: 'media',
  keywords: ['film', 'movie', 'video', 'scene', 'take', 'action', 'production', 'clapper'],
  variants: (k) => ({
    stick: {
      rest: { rotate: -12, transition: k.tween('base') },
      active: { rotate: [null, 0, -12], transition: seq(k, 'slow', [0, 0.28, 1], ['exit', 'emphasized']) },
    },
    board: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, 0, 0.6, 0], transition: seq(k, 'slow', [0, 0.26, 0.36, 1], ['linear', 'exit', 'emphasized']) },
    },
  }),
  render: (v) => (
    <m.g variants={v.board}>
      <path d="M3 10.5 H21 V19 A2 2 0 0 1 19 21 H5 A2 2 0 0 1 3 19 Z" />
      <m.g variants={v.stick} style={origin(3, 10.5)}>
        <path d="M3 10.5 V8.5 A1.5 1.5 0 0 1 4.5 7 H19.5 A1.5 1.5 0 0 1 21 8.5 V10.5" />
        <path d="M8 7 L9.5 10.5 M13 7 L14.5 10.5 M18 7 L19.5 10.5" />
      </m.g>
    </m.g>
  ),
})
