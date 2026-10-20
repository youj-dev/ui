import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* Each triangle and its mirror image share three points, reflected in the
 * axis, so interpolating them folds the shape edge-on into the axis. */
const TOP = 'M6.5 3.5 L12 9.5 L17.5 3.5 Z'
const BOTTOM = 'M6.5 20.5 L12 14.5 L17.5 20.5 Z'
const AXIS = ['M2.5 12 H4.5', 'M8 12 H10', 'M14 12 H16', 'M19.5 12 H21.5']

/** Original ↔ flipped. The solid shape folds edge-on into the mirror axis and opens out on the other side, while its outline ghost flips the other way to take its old place. `active` = flipped. */
export const FlipVerticalIcon = createIcon({
  name: 'flip-vertical',
  category: 'editor',
  keywords: ['flip', 'mirror', 'reflect', 'vertical', 'upside down', 'transform'],
  states: ['original', 'flipped'],
  variants: (k) => {
    const flip = (d: string) => ({ d, transition: k.tween('slow', 'emphasized') })
    return {
      solid: { rest: flip(TOP), active: flip(BOTTOM) },
      ghost: { rest: flip(BOTTOM), active: flip(TOP) },
    }
  },
  render: (v) => (
    <>
      {AXIS.map((d) => (
        <path key={d} d={d} />
      ))}
      <m.path d={BOTTOM} opacity={0.4} variants={v.ghost} />
      <m.path d={TOP} fill="currentColor" variants={v.solid} />
    </>
  ),
})
