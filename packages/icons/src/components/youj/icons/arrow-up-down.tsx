import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* ⇅: the up arrow left of the down arrow, staggered so each shaft starts
 * level with the other's head. Straight shafts and 90° heads, as on the
 * single arrows. */

/** Sort. The up arrow rises out of frame and back in from below while the down arrow sinks out and back in from above, a beat behind. */
export const ArrowUpDownIcon = createIcon({
  name: 'arrow-up-down',
  category: 'arrows',
  keywords: ['sort', 'order', 'reorder', 'vertical', 'ascending', 'descending'],
  variants: (k) => {
    const travel = (dir: 1 | -1, delay: number) => ({
      rest: { y: 0, opacity: 1, transition: k.tween('fast') },
      active: {
        y: [null, 8 * dir, -8 * dir, 0],
        opacity: [null, 0, 0, 1],
        transition: seq(k, 'deliberate', [0, 0.36, 0.37, 1], ['exit', 'linear', 'emphasized'], delay),
      },
    })
    return { up: travel(-1, 0), down: travel(1, k.stagger('loose')) }
  },
  render: (v) => (
    <>
      <m.g variants={v.up}>
        <path d="M8 16 V4" />
        <path d="M4 8 L8 4 L12 8" />
      </m.g>
      <m.g variants={v.down}>
        <path d="M16 8 V20" />
        <path d="M12 16 L16 20 L20 16" />
      </m.g>
    </>
  ),
})
