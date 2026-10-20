import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* The axis runs behind the objects: a mask cut by each object's box (fill and
 * stroke) hides it wherever an object is, including while the object moves. */
const A = { x: 5.5, y: 5.5, width: 5, height: 13, rx: 1.5 }
const B = { x: 13.5, y: 8, width: 5, height: 8, rx: 1.5 }

/**
 * Align vertical centers. The objects drift apart above and below the axis,
 * the short one a beat behind, and snap back centered on it.
 */
export const AlignCenterHorizontalIcon = createIcon({
  name: 'align-center-horizontal',
  category: 'editor',
  keywords: ['align', 'align middle', 'vertical centers', 'middle', 'centre', 'center', 'objects', 'layers', 'layout', 'align-center-horizontal'],
  variants: (k) => {
    const snap = (dy: number, delay: number) => ({
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, dy, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], delay) },
    })
    return { a: snap(-2.5, 0), b: snap(2.5, k.stagger('loose')) }
  },
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        <m.rect {...A} fill="black" stroke="black" variants={v.a} />
        <m.rect {...B} fill="black" stroke="black" variants={v.b} />
      </mask>
      <path d="M3 12 H21" mask={`url(#${id}-m)`} />
      <m.rect {...A} variants={v.a} />
      <m.rect {...B} variants={v.b} />
    </>
  ),
})
