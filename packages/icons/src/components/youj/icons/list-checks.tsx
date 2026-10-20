import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, origin, type IconVariants } from './icon-base'

const ROWS = [6, 12, 18]

/** Tasks get done: each tick is written in turn, top to bottom, and lands with a small settle. */
export const ListChecksIcon = createIcon({
  name: 'list-checks',
  category: 'editor',
  keywords: ['checklist', 'todo', 'tasks', 'done', 'complete', 'list'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      ROWS.map((_, i) => {
        const delay = i * k.stagger('loose') * 1.5
        const draw = drawIn(k, 'base', delay, 'standard')
        return [
          `t${i}`,
          {
            from: { ...hidden, scale: 0.8 },
            rest: { ...drawn(k), scale: 1 },
            active: {
              ...draw,
              scale: [0.8, 1],
              transition: { ...draw.transition, scale: { ...k.spring('settle'), delay: delay + k.duration('fast') } },
            },
          },
        ]
      }),
    ),
  render: (v) => (
    <>
      {ROWS.map((y, i) => (
        <g key={y}>
          <m.path d={`M3 ${y} L5 ${y + 2} L9 ${y - 2}`} variants={v[`t${i}`]} style={origin(6, y)} />
          <path d={`M12 ${y} H21`} />
        </g>
      ))}
    </>
  ),
})
