import { m } from 'motion/react'
import { createIcon, after, origin, seq, type IconVariants } from './icon-base'

/* Pins in clockwise order from the top left. */
const PINS = ['M9 2.5 V5', 'M15 2.5 V5', 'M19 9 H21.5', 'M19 15 H21.5', 'M15 19 V21.5', 'M9 19 V21.5', 'M2.5 15 H5', 'M2.5 9 H5']

/**
 * A clock cycle: a current runs round the pins clockwise and the core ticks
 * over a quarter turn. Rest is 90° so leaving mid-tick finishes forwards.
 */
export const CpuIcon = createIcon({
  name: 'cpu',
  category: 'development',
  keywords: ['processor', 'chip', 'compute', 'hardware', 'performance', 'silicon'],
  variants: (k): IconVariants => ({
    core: {
      rest: { rotate: 90, transition: k.tween('base', 'enter') },
      active: { rotate: [0, 90], transition: after(k, k.stagger('tight') * 6, 'slow', 'emphasized') },
    },
    ...Object.fromEntries(
      PINS.map((_, i) => [
        `p${i}`,
        {
          rest: { opacity: 1, transition: k.tween('fast') },
          active: { opacity: [1, 0.15, 1], transition: seq(k, 'base', [0, 0.3, 1], ['exit', 'enter'], i * k.stagger('tight') * 1.5) },
        },
      ]),
    ),
  }),
  render: (v) => (
    <>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <m.rect x="9" y="9" width="6" height="6" rx="1" variants={v.core} style={origin(12, 12)} />
      {PINS.map((d, i) => (
        <m.path key={d} d={d} variants={v[`p${i}`]} />
      ))}
    </>
  ),
})

