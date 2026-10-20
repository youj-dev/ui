import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* The lid keeps one command structure while closing: its top edge drops to
 * the hinge and the side edges shorten to nothing, so the stroke width and
 * corner radius never distort. */
const OPEN = 'M6 5 H18 A2 2 0 0 1 20 7 V14 A2 2 0 0 1 18 16 H6 A2 2 0 0 1 4 14 V7 A2 2 0 0 1 6 5 Z'
const SHUT = 'M6 12 H18 A2 2 0 0 1 20 14 V14 A2 2 0 0 1 18 16 H6 A2 2 0 0 1 4 14 V14 A2 2 0 0 1 6 12 Z'

/** The lid swings shut onto its hinge, the base takes the weight, and the lid lifts open again. */
export const LaptopIcon = createIcon({
  name: 'laptop',
  category: 'devices',
  keywords: ['computer', 'notebook', 'macbook', 'device', 'desktop app', 'session'],
  variants: (k) => ({
    lid: {
      rest: { d: OPEN, transition: k.tween('base') },
      active: { d: [null, SHUT, SHUT, OPEN], transition: seq(k, 'deliberate', [0, 0.3, 0.42, 1], ['exit', 'linear', 'emphasized']) },
    },
    base: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, 0, 0.75, 0], transition: seq(k, 'deliberate', [0, 0.28, 0.38, 1], ['linear', 'exit', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d={OPEN} variants={v.lid} />
      <m.path d="M2.5 19 H21.5" variants={v.base} />
    </>
  ),
})
