'use client'

import { useId, type ReactNode } from 'react'
import { toneColor } from '../../../lib/utils'
import type { CauseRingsCause } from './data'
import { rankContributors, sectorPath, sliceArcs, TAU } from './geometry'

/* Two rings. The inner one is the causes, solid, each as wide as its figure.
 * The outer one cuts every cause's span into the machines (or lines, or shifts)
 * its share came from: the largest three are hatched in the cause's color,
 * each pattern its own (lines, dots, crosses), and the rest is a plain tint.
 * Patterns and a 1px edge carry the meaning, so it reads without color and in
 * print. The legend and the line under the chart are its text equivalent. */

const SIZE = 240
const C = SIZE / 2
const INNER = [58, 82] as const
const OUTER = [88, 112] as const
const GAP = 0.018

/** The pattern (a swatch or a fill) for a contributor's rank: 1 lines, 2 dots, 3 crosses, 0 a plain tint. */
export function Hatch({ id, color, rank }: { id: string; color: string; rank: number }) {
  return (
    <pattern id={id} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width={5} height={5} fill={color} fillOpacity={rank === 0 ? 0.14 : 0.2} />
      {rank === 1 && <line x1={0} y1={0} x2={0} y2={5} stroke={color} strokeWidth={2} />}
      {rank === 2 && <circle cx={2.5} cy={2.5} r={1.1} fill={color} />}
      {rank === 3 && <path d="M0 0V5M0 2.5H5" stroke={color} strokeWidth={1.1} />}
    </pattern>
  )
}

interface DonutProps {
  causes: CauseRingsCause[]
  /** The cause whose arcs stay lit; the others recede. */
  active: string | null
  label: string
  /** The center of the ring: the lit cause's name and share. */
  children: ReactNode
}

export function Donut({ causes, active, label, children }: DonutProps) {
  const uid = useId()
  const spans = sliceArcs(causes.map((c) => c.value), 0, TAU, GAP)
  const raw = sliceArcs(causes.map((c) => c.value))
  return (
    <div className="relative mx-auto aspect-square w-full max-w-60">
      <svg role="img" aria-label={label} viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full">
        <defs>
          {causes.flatMap((cause) => [0, 1, 2, 3].map((rank) => <Hatch key={`${cause.id}${rank}`} id={`${uid}${cause.id}${rank}`} color={toneColor(cause.tone)} rank={rank} />))}
        </defs>
        {causes.map((cause, i) => {
          const span = spans[i]
          const whole = raw[i]
          if (!span || !whole) return null
          const color = toneColor(cause.tone)
          const parts = rankContributors(cause.contributors ?? [], cause.value)
          const outer = sliceArcs(parts.map((p) => p.value), whole.from, whole.to, GAP)
          return (
            <g key={cause.id} className="transition-opacity yj-duration-fast ease-standard" opacity={active && active !== cause.id ? 0.3 : 1}>
              <path d={sectorPath(C, C, INNER[0], INNER[1], span.from, span.to)} fill={color} />
              {parts.map((part, j) => {
                const arc = outer[j]
                return arc ? (
                  <path key={part.rank} d={sectorPath(C, C, OUTER[0], OUTER[1], arc.from, arc.to)} fill={`url(#${uid}${cause.id}${part.rank})`} stroke={color} strokeWidth={1} />
                ) : null
              })}
            </g>
          )
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}
