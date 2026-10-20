import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* One cubic between the two anchors. Mid-edit its controls are pulled
 * toward the straight line and let go, so the curve flexes and settles. */
const CURVE = 'M5 17.25 C5 10.5 10.5 5 17.25 5'
const FLEXED = 'M5 17.25 C8 13.25 12.5 8.5 17.25 5'

/** Editing a curve: the anchors nudge toward each other and the curve flexes almost straight, then springs back into its bend. */
export const SplineIcon = createIcon({
  name: 'spline',
  category: 'editor',
  keywords: ['curve', 'bezier', 'vector', 'path', 'pen tool', 'easing', 'spline'],
  variants: (k) => {
    const t = seq(k, 'deliberate', [0, 0.35, 1], ['standard', 'emphasized'])
    const anchor = (dx: number, dy: number) => ({
      rest: { x: 0, y: 0, transition: k.tween('fast') },
      active: { x: [null, dx, 0], y: [null, dy, 0], transition: t },
    })
    return {
      curve: { rest: { d: CURVE, transition: k.tween('base') }, active: { d: [null, FLEXED, CURVE], transition: t } },
      start: anchor(0.5, -0.5),
      end: anchor(-0.5, 0.5),
    }
  },
  render: (v) => (
    <>
      <m.path d={CURVE} variants={v.curve} />
      <m.circle cx="5" cy="19" r="1.75" variants={v.start} style={origin(5, 19)} />
      <m.circle cx="19" cy="5" r="1.75" variants={v.end} style={origin(19, 5)} />
    </>
  ),
})
