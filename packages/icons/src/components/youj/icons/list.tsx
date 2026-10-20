import { m } from 'motion/react'
import { createIcon, type IconVariants } from './icon-base'

const ROWS = [6, 12, 18]
/* A bullet is a check with its three points gathered into one dot, so it can
 * unfold into the tick point for point. */
const bullet = (y: number) => `M2.99 ${y} L3 ${y} L3.01 ${y}`
const tick = (y: number) => `M3 ${y} L5 ${y + 2} L9 ${y - 2}`

/**
 * Bulleted ↔ checklist. Row by row, each bullet unfolds into a tick and its
 * line steps aside to make room; reversing folds the ticks back into dots,
 * last row first. `active` = checklist.
 */
export const ListIcon = createIcon({
  name: 'list',
  category: 'editor',
  keywords: ['bullets', 'unordered', 'list', 'checklist', 'todo', 'tasks'],
  states: ['bulleted', 'checklist'],
  variants: (k): IconVariants => {
    const s = k.stagger('base')
    const last = ROWS.length - 1
    return Object.fromEntries(
      ROWS.flatMap((y, i) => [
        [
          `b${i}`,
          {
            rest: { d: bullet(y), transition: { ...k.spring('snappy'), delay: (last - i) * s } },
            active: { d: tick(y), transition: { ...k.spring('snappy'), delay: i * s } },
          },
        ],
        [
          `l${i}`,
          {
            rest: { d: `M8 ${y} H21`, transition: { ...k.spring('snappy'), delay: (last - i) * s } },
            active: { d: `M12 ${y} H21`, transition: { ...k.spring('snappy'), delay: i * s } },
          },
        ],
      ]),
    )
  },
  render: (v) => (
    <>
      {ROWS.map((y, i) => (
        <g key={y}>
          <m.path d={bullet(y)} variants={v[`b${i}`]} />
          <m.path d={`M8 ${y} H21`} variants={v[`l${i}`]} />
        </g>
      ))}
    </>
  ),
})
