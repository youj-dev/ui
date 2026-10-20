'use client'

import { useYouj } from '@youj/core'
import { Hatch } from '../../../components/ui/hatched-bar'
import { cn } from '../../../lib/utils'

export type Tone = 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

export const TONES: Tone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']
export const FILL: Record<Tone, string> = {
  'chart-1': 'bg-chart-1',
  'chart-2': 'bg-chart-2',
  'chart-3': 'bg-chart-3',
  'chart-4': 'bg-chart-4',
  'chart-5': 'bg-chart-5',
}

export interface Segment {
  id: string
  tone: Tone
  /** Its share of the whole, 0 to 1. */
  share: number
}

/* The split as one bar: a segment per row, sized to its share, and what is not
 * yet allocated hatched at the end. Over-allocated, the segments scale down to
 * fill the bar. Decorative: the numbers are in text beside it. */
export function AllocationBar({ segments, left }: { segments: Segment[]; left: number }) {
  const k = useYouj()
  const grow = k.reduced ? '' : 'transition-[flex-grow] yj-duration-base ease-standard'
  return (
    <div aria-hidden data-slot="split-bar" className="flex h-2.5 gap-0.5">
      {segments
        .filter((segment) => segment.share > 0)
        .map((segment) => (
          <span key={segment.id} className={cn('min-w-0 rounded-full', FILL[segment.tone], grow)} style={{ flexGrow: segment.share, flexBasis: 0 }} />
        ))}
      {left > 0 && <Hatch tone="neutral" className={cn('min-w-0 rounded-full', grow)} style={{ flexGrow: left, flexBasis: 0 }} />}
    </div>
  )
}

const TICKS = 10

/* A row's share in ten ticks, lit from the start in the row's color. Decorative. */
export function TickMeter({ share, tone }: { share: number; tone: Tone }) {
  const lit = Math.min(TICKS, Math.round(share * TICKS))
  return (
    <span aria-hidden data-slot="split-ticks" className="hidden items-center justify-end gap-px sm:flex">
      {Array.from({ length: TICKS }, (_, i) => (
        <span key={i} className={cn('h-3 w-0.5 rounded-full', i < lit ? FILL[tone] : 'bg-line')} />
      ))}
    </span>
  )
}
