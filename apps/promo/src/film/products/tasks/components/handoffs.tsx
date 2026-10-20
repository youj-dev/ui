'use client'

import { motion, useTransform } from 'motion/react'
import { cn } from '@youj/react/lib/utils'
import type { Schedule } from '../schedule'
import type { BarValues } from '../use-bars'

/* The handoffs: a line from the end of each task to the start of every task
 * waiting on it, drawn from the bars' own motion values, so the lines move
 * with the bars frame by frame. The chain that sets the launch date is drawn
 * in the accent, or the warning ink when it runs late; the rest are quiet. */

function Handoff({ from, to, y1, y2, dir, width, tone }: { from: BarValues; to: BarValues; y1: number; y2: number; dir: 1 | -1; width: number; tone: 'quiet' | 'chain' | 'late' }) {
  // Mirrored under RTL, where the runway reads from the right.
  const at = (x: number) => (dir === 1 ? x : width - x)
  const d = useTransform(() => {
    const x1 = at(from.x.get() + from.w.get() - 2)
    const x2 = at(to.x.get() + 2)
    const c = Math.max(12, Math.abs(x2 - x1) / 2) * dir
    return `M ${x1} ${y1} C ${x1 + c} ${y1}, ${x2 - c} ${y2}, ${x2} ${y2}`
  })
  const cx = useTransform(() => at(to.x.get() + 2))
  return (
    <g className={cn('transition-[stroke,fill,opacity] yj-duration-base ease-standard', tone === 'quiet' ? 'stroke-fg-subtle fill-fg-subtle opacity-45' : tone === 'late' ? 'stroke-warning fill-warning' : 'stroke-accent fill-accent')}>
      <motion.path d={d} fill="none" strokeWidth={tone === 'quiet' ? 1 : 1.5} />
      <motion.circle cx={cx} cy={y2} r={2.5} stroke="none" />
    </g>
  )
}

export function Handoffs({ placed, rowY, valuesFor, dir, width, height, chain, late }: { placed: Schedule; rowY: Map<string, number>; valuesFor: (id: string) => BarValues; dir: 1 | -1; width: number; height: number; chain: Set<string>; late: boolean }) {
  const edges = [...placed.values()].flatMap((p) => p.task.after.filter((id) => placed.has(id) && rowY.has(id)).map((id) => ({ from: id, to: p.task.id })))
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" width={width} height={height}>
      {edges.map((e) => (
        <Handoff
          key={`${e.from}-${e.to}`}
          from={valuesFor(e.from)}
          to={valuesFor(e.to)}
          y1={rowY.get(e.from)!}
          y2={rowY.get(e.to)!}
          dir={dir}
          width={width}
          tone={chain.has(e.from) && chain.has(e.to) ? (late ? 'late' : 'chain') : 'quiet'}
        />
      ))}
    </svg>
  )
}
