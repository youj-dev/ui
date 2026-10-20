import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/**
 * Open ↔ hit, for goals and targets reached. An arrow flies in along the
 * diagonal and sticks in the bullseye with a settle, knocking the target
 * back a touch; reopening pulls it out the way it came. `active` = hit.
 */
export const TargetIcon = createIcon({
  name: 'target',
  category: 'data',
  keywords: ['goal', 'target', 'objective', 'aim', 'okr', 'bullseye', 'focus', 'milestone'],
  states: ['open', 'hit'],
  variants: (k) => ({
    arrow: {
      rest: { x: 7, y: -7, opacity: 0, transition: { x: k.tween('base', 'exit'), y: k.tween('base', 'exit'), opacity: k.tween('fast', 'exit') } },
      active: { x: 0, y: 0, opacity: 1, transition: { x: k.spring('settle'), y: k.spring('settle'), opacity: k.tween('instant') } },
    },
    rings: {
      rest: { x: 0, y: 0, transition: k.tween('fast') },
      active: { x: [null, -0.6, 0], y: [null, 0.6, 0], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized'], k.duration('base') * 0.6) },
    },
  }),
  render: (v) => (
    <>
      <m.g variants={v.rings}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5.5" />
        <circle cx="12" cy="12" r="2" />
      </m.g>
      <m.path d="M12 12 L18.5 5.5 M18.5 5.5 V3.5 M18.5 5.5 H20.5" variants={v.arrow} style={origin(12, 12)} />
    </>
  ),
})
