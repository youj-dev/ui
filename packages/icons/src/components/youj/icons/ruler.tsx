import { m } from 'motion/react'
import { createIcon, origin, seq, type IconVariants } from './icon-base'

/* Drawn upright with its marks along the left edge, long and short in turn,
 * then laid on the 45° diagonal. */
const MARKS = [
  { y: 6, length: 3 },
  { y: 9.5, length: 2 },
  { y: 13, length: 3 },
  { y: 16.5, length: 2 },
]

/** Measuring: a reading runs down the ruler, each mark reaching out in turn as it passes. */
export const RulerIcon = createIcon({
  name: 'ruler',
  category: 'editor',
  keywords: ['ruler', 'measure', 'dimensions', 'size', 'spacing', 'guides', 'layout'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      MARKS.map((_, i) => [
        `m${i}`,
        {
          rest: { scaleX: 1, transition: k.tween('fast') },
          active: { scaleX: [null, 1.6, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'emphasized'], i * k.stagger('loose')) },
        },
      ]),
    ),
  render: (v) => (
    <g transform="rotate(45 12 12)">
      <rect x="8.5" y="2.5" width="7" height="19" rx="1.5" />
      {MARKS.map(({ y, length }, i) => (
        <m.path key={y} d={`M8.5 ${y} H${8.5 + length}`} variants={v[`m${i}`]} style={origin(8.5, y)} />
      ))}
    </g>
  ),
})
