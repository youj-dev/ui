import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Each bar narrows in turn, top to bottom, like results being sifted. */
export const FilterIcon = createIcon({
  name: 'filter',
  category: 'actions',
  keywords: ['sort', 'refine', 'funnel', 'narrow', 'list-filter', 'list filter'],
  variants: (k) => {
    const bar = (i: number) => ({
      rest: { scaleX: 1, transition: k.tween('fast') },
      active: { scaleX: [1, 0.55, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], i * k.stagger('loose')) },
    })
    return { b0: bar(0), b1: bar(1), b2: bar(2) }
  },
  render: (v) => (
    <>
      <m.path d="M4 7 H20" variants={v.b0} style={origin(12, 7)} />
      <m.path d="M7 12 H17" variants={v.b1} style={origin(12, 12)} />
      <m.path d="M10 17 H14" variants={v.b2} style={origin(12, 17)} />
    </>
  ),
})
