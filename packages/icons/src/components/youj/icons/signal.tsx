import { m } from 'motion/react'
import { after, createIcon, type IconVariants } from './icon-base'

/* Four bars on one baseline, the first always lit. A bar that has lost
 * signal keeps its slot as a dot: the same path with its top brought down
 * to the base. */
const BASE = 20
const FIRST = 'M4.5 20 L4.5 17'
const BARS = [
  { x: 9.5, top: 13 },
  { x: 14.5, top: 9 },
  { x: 19.5, top: 5 },
]
const bar = (x: number, top: number) => `M${x} ${BASE} L${x} ${top}`

/**
 * Full ↔ weak. The bars fall back to the baseline from the strongest down,
 * leaving a dot in each empty slot; when signal returns they climb back up
 * in order. `active` = weak.
 */
export const SignalIcon = createIcon({
  name: 'signal',
  category: 'system',
  keywords: ['signal', 'cellular', 'reception', 'network', 'strength', 'bars', 'connection'],
  states: ['full', 'weak'],
  variants: (k): IconVariants => {
    const s = k.stagger('base')
    return Object.fromEntries(
      BARS.map(({ x, top }, i) => [
        `b${i}`,
        {
          rest: { d: bar(x, top), transition: after(k, i * s, 'slow', 'emphasized') },
          active: { d: bar(x, BASE - 0.01), transition: after(k, (BARS.length - 1 - i) * s, 'base', 'exit') },
        },
      ]),
    )
  },
  render: (v) => (
    <>
      <path d={FIRST} />
      {BARS.map(({ x, top }, i) => (
        <m.path key={x} d={bar(x, top)} variants={v[`b${i}`]} />
      ))}
    </>
  ),
})
