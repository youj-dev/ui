'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { animate, m, useInView, useMotionValue, useTransform } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'
import { OUTER, pointAt, sectorPath } from './model'

/* The half-donut. Each segment is an arc that follows its target: a new
 * period or new data moves every edge on the base token, so segments grow,
 * shrink and slide rather than swap, and one that is new opens from where it
 * lies. It sweeps in from the left the first time it is seen. Pointing at a
 * segment (or at its row, or moving focus to it) quiets the others and puts a
 * tag over it. The picture is decorative: the rows carry the words. Reduced
 * motion: drawn at once. */

export interface GaugeSlice {
  id: string
  /** Where it starts and ends along the half turn, 0 to 1. */
  from: number
  to: number
  /** A CSS color. */
  color: string
}

interface ArcProps {
  slice: GaugeSlice
  sweep: ReturnType<typeof useMotionValue<number>>
  dimmed: boolean
  /** Drawn with the gauge, not added later: it starts at its place instead of opening. */
  initial: boolean
  onActive: (id: string | null) => void
}

function Arc({ slice, sweep, dimmed, initial, onActive }: ArcProps) {
  const k = useYouj()
  const from = useMotionValue(slice.from)
  const to = useMotionValue(initial || k.reduced ? slice.to : slice.from)
  const d = useTransform([from, to, sweep], ([a, b, s]: number[]) => sectorPath(a! * s!, b! * s!))
  useEffect(() => {
    if (k.reduced) {
      from.set(slice.from)
      to.set(slice.to)
      return
    }
    const move = k.tween('base', 'standard')
    const a = animate(from, slice.from, move)
    const b = animate(to, slice.to, move)
    return () => {
      a.stop()
      b.stop()
    }
  }, [slice.from, slice.to, k, from, to])
  return (
    <m.path
      d={d}
      data-slot="share-gauge-arc"
      data-yj-segment={slice.id}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={5}
      strokeLinejoin="round"
      className={cn('transition-opacity yj-duration-fast ease-standard', dimmed && 'opacity-30')}
      style={{ color: slice.color }}
      onPointerEnter={() => onActive(slice.id)}
      onPointerLeave={() => onActive(null)}
    />
  )
}

interface GaugeProps {
  slices: readonly GaugeSlice[]
  active: string | null
  onActive: (id: string | null) => void
  /** The words over a segment, by its id. */
  tag: (id: string) => ReactNode
  /** Under the arc, in the middle: the total and the period. */
  children: ReactNode
  'aria-label': string
  className?: string
}

function Gauge({ slices, active, onActive, tag, children, className, 'aria-label': label }: GaugeProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const sweep = useMotionValue(k.reduced ? 1 : 0)
  // Arcs drawn with the dial are there at once; a slice added later grows in.
  const [firstSlices] = useState(slices)
  useEffect(() => {
    if (k.reduced) sweep.set(1)
    else if (inView) animate(sweep, 1, k.tween('deliberate', 'enter'))
  }, [inView, k, sweep])

  // The tag stays mounted and fades, so it glides between segments instead of popping.
  const [last, setLast] = useState(active)
  if (active && active !== last) setLast(active)
  const at = slices.find((s) => s.id === last)
  const mid = at ? pointAt((at.from + at.to) / 2, OUTER) : null

  return (
    <MotionFeatures>
      <div ref={ref} data-slot="share-gauge-dial" className={cn('relative mx-auto mt-6 aspect-200/108 w-full max-w-88', className)}>
        <svg role="img" aria-label={label} viewBox="0 0 200 108" className="size-full overflow-visible">
          {slices.map((slice) => (
            <Arc key={slice.id} slice={slice} sweep={sweep} dimmed={active !== null && active !== slice.id} initial={slices === firstSlices} onActive={onActive} />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">{children}</div>
        {mid && (
          <div
            aria-hidden
            data-slot="share-gauge-tag"
            data-yj-tone="inverse"
            className={cn(
              'pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-inverse px-2.5 py-1.5 text-ui-sm whitespace-nowrap text-fg shadow-sm transition-[opacity,left,top] yj-duration-fast ease-standard',
              active ? 'opacity-100' : 'opacity-0',
            )}
            style={{ left: `${Math.min(80, Math.max(20, (mid.x / 200) * 100))}%`, top: `calc(${(mid.y / 108) * 100}% - 0.5rem)` }}
          >
            {last && tag(last)}
          </div>
        )}
      </div>
    </MotionFeatures>
  )
}

export { Gauge }
