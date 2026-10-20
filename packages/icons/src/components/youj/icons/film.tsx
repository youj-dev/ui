import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* The strip repeats every 11 units (one frame: two sprocket holes and a
 * frame line), so it's drawn one frame long below the gate. Pulling it down
 * by exactly one frame lands on an identical picture. */
const FRAME = 11
const HOLES = [6.5, 12, 17.5, 23, 28.5]
const LINES = [12, 23]

/**
 * The strip advances one frame through the gate: sprocket holes and frame
 * line pull down together in a single claw stroke. Rest is the end of the
 * advance, so leaving mid-pull finishes it.
 */
export const FilmIcon = createIcon({
  name: 'film',
  category: 'media',
  keywords: ['movie', 'video', 'cinema', 'reel', 'footage', 'media'],
  variants: (k) => ({
    reel: {
      rest: { y: 0, transition: k.tween('base', 'enter') },
      active: { y: [-FRAME, 0], transition: k.tween('slow', 'emphasized') },
    },
  }),
  render: (v, { id }) => (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 3 V21 M16 3 V21" />
      <clipPath id={`${id}-c`}>
        <rect x="4" y="3.75" width="16" height="16.5" />
      </clipPath>
      <g clipPath={`url(#${id}-c)`}>
        <m.g variants={v.reel}>
          {HOLES.map((y) => (
            <path key={y} d={`M6 ${y} h.01 M18 ${y} h.01`} strokeWidth={2} />
          ))}
          {LINES.map((y) => (
            <path key={y} d={`M8 ${y} H16`} />
          ))}
        </m.g>
      </g>
    </>
  ),
})
