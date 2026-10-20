import { m } from 'motion/react'
import { createIcon, after, origin, seq } from './icon-base'

/* The tape and the check share one three-point structure: the tape swings on
 * its middle and the far end rises into the check's long stroke. */
const TAPE = 'M7.75 4.75 L12 7 L16.25 9.25'
const CHECK = 'M8.5 7.25 L10.75 9.5 L14.75 5.5'

/**
 * In transit ↔ delivered. The box is set down with a soft thud and its tape
 * folds into a check on the lid. `active` = delivered.
 */
export const PackageIcon = createIcon({
  name: 'package',
  category: 'commerce',
  keywords: ['box', 'parcel', 'delivery', 'shipping', 'order', 'delivered', 'product'],
  states: ['in transit', 'delivered'],
  variants: (k) => ({
    box: {
      rest: { scaleY: 1, transition: k.tween('fast') },
      active: { scaleY: [null, 0.92, 1], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized']) },
    },
    tape: {
      rest: { d: TAPE, transition: k.tween('base') },
      active: { d: CHECK, transition: after(k, k.duration('fast'), 'slow', 'emphasized') },
    },
  }),
  render: (v) => (
    <m.g variants={v.box} style={origin(12, 21.5)}>
      <path d="M12 2.5 L20.5 7 V17 L12 21.5 L3.5 17 V7 Z" />
      <path d="M3.5 7 L12 11.5 L20.5 7" />
      <path d="M12 11.5 V21.5" />
      <m.path d={TAPE} variants={v.tape} />
    </m.g>
  ),
})
