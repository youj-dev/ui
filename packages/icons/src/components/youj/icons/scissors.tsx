import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* Open shears lying on their side: two finger rings (r 2.75) stacked at the
 * left, the pivot at (13, 12) and long blades reaching past it to the right.
 * Each ring's blade runs from the ring's rim through the pivot to the
 * opposite tip, so rotating a ring and its blade about the pivot closes them. */
const PIVOT = [13, 12] as const

/** Two quick snips: both blades close on the pivot and open again, twice, the second cut a touch firmer. */
export const ScissorsIcon = createIcon({
  name: 'scissors',
  category: 'editor',
  keywords: ['cut', 'scissors', 'trim', 'clip', 'split', 'snip', 'edit'],
  variants: (k) => {
    const snip = (dir: 1 | -1) => ({
      rest: { rotate: 0, transition: k.tween('fast') },
      active: {
        rotate: [null, 9 * dir, 0, 12 * dir, 0],
        transition: seq(k, 'deliberate', [0, 0.2, 0.45, 0.68, 1], ['exit', 'enter', 'exit', 'emphasized']),
      },
    })
    return { upper: snip(-1), lower: snip(1) }
  },
  render: (v) => (
    <>
      {/* The upper ring's blade passes under the lower one: it stops short of the pivot and resumes past it. */}
      <m.g variants={v.upper} style={origin(...PIVOT)}>
        <circle cx="6.5" cy="7.5" r="2.75" />
        <path d="M8.76 9.07 L12.1 11.37" />
        <path d="M13.9 12.63 L20.5 17.19" />
      </m.g>
      <m.g variants={v.lower} style={origin(...PIVOT)}>
        <circle cx="6.5" cy="16.5" r="2.75" />
        <path d="M8.76 14.93 L20.5 6.81" />
      </m.g>
    </>
  ),
})
