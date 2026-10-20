import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* Each triangle and its mirror image share three points, reflected in the
 * axis, so interpolating them folds the shape edge-on into the axis half way
 * and opens it out on the other side: a flip seen from above. */
const LEFT = 'M3.5 6.5 L9.5 12 L3.5 17.5 Z'
const RIGHT = 'M20.5 6.5 L14.5 12 L20.5 17.5 Z'
const AXIS = ['M12 2.5 V4.5', 'M12 8 V10', 'M12 14 V16', 'M12 19.5 V21.5']

/**
 * Original ↔ flipped. The solid shape folds edge-on into the mirror axis and
 * opens out on the other side, while its outline ghost flips the other way
 * to take its old place. `active` = flipped.
 */
export const FlipHorizontalIcon = createIcon({
  name: 'flip-horizontal',
  category: 'editor',
  keywords: ['flip', 'mirror', 'reflect', 'horizontal', 'image', 'transform', 'symmetry'],
  states: ['original', 'flipped'],
  variants: (k) => {
    const flip = (d: string) => ({ d, transition: k.tween('slow', 'emphasized') })
    return {
      solid: { rest: flip(LEFT), active: flip(RIGHT) },
      ghost: { rest: flip(RIGHT), active: flip(LEFT) },
    }
  },
  render: (v) => (
    <>
      {AXIS.map((d) => (
        <path key={d} d={d} />
      ))}
      <m.path d={RIGHT} opacity={0.4} variants={v.ghost} />
      <m.path d={LEFT} fill="currentColor" variants={v.solid} />
    </>
  ),
})
