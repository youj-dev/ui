import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* search's lens and handle. The plus's upright folds into its own center,
 * a point on the crossbar, which leaves a minus. */
const UPRIGHT = 'M10.5 7.5 L10.5 13.5'
const FOLDED = 'M10.5 10.49 L10.5 10.51'

/**
 * Zoom in ↔ zoom out. The lens pulls back a touch as the plus folds its
 * upright into the crossbar; zooming in again pushes the lens forward and
 * the upright springs back out of the center. `active` = zoom out.
 */
export const ZoomInIcon = createIcon({
  name: 'zoom-in',
  category: 'actions',
  keywords: ['zoom', 'magnify', 'enlarge', 'zoom out', 'scale', 'minus', 'plus'],
  states: ['zoom in', 'zoom out'],
  variants: (k) => {
    const nudge = (to: number) => ({ scale: [null, to, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized']) })
    return {
      lens: { rest: nudge(1.06), active: nudge(0.92) },
      upright: {
        rest: { d: UPRIGHT, transition: k.spring('snappy') },
        active: { d: FOLDED, transition: k.tween('base', 'emphasized') },
      },
    }
  },
  render: (v) => (
    <>
      <m.g variants={v.lens} style={origin(10.5, 10.5)}>
        <circle cx="10.5" cy="10.5" r="7" />
        <path d="M7.5 10.5 H13.5" />
        <m.path d={UPRIGHT} variants={v.upright} />
      </m.g>
      <path d="M15.5 15.5 L20.5 20.5" />
    </>
  ),
})
