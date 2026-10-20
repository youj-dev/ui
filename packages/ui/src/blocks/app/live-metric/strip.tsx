'use client'

import { useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'
import { cn } from '../../../lib/utils'

/* The last few minutes as a bar per bucket, the one filling now lit at the
 * end. The bars are keyed by their bucket, so when a new one opens the strip
 * slides along by one: the oldest leaves at the start, the new one rises in
 * at the end, and the current bar grows as its views arrive. The scale only
 * grows at once; it shrinks only when the tallest bar is well under it, so
 * the bars don't twitch. Reduced motion: bars change in place. Time reads
 * left to right in either direction of text. */

interface StripProps {
  series: number[]
  /** The bucket filling now; it goes up by one per bucket. */
  bucket: number
  label: string
  /** The strip's two ends, oldest and now. */
  ends: [string, string]
}

/** A round top: 1, 2, 2.5 or 5 times a power of ten. */
const nice = (max: number) => {
  const power = 10 ** Math.floor(Math.log10(max || 1))
  const n = max / power
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * power
}

function Strip({ series, bucket, label, ends }: StripProps) {
  const k = useYouj()
  const n = series.length
  const tallest = Math.max(1, ...series)
  // The scale holds unless the bars outgrow it or fall well under it.
  const [scale, setScale] = useState(() => nice(tallest * 1.15))
  const top = tallest > scale || tallest < scale * 0.45 ? nice(tallest * 1.15) : scale
  if (top !== scale) setScale(top)
  const glide = k.reduced ? { type: false as const } : k.tween('base', 'standard')
  const grow = k.reduced ? { type: false as const } : k.spring('smooth')

  return (
    <figure className="flex flex-col gap-1.5">
      <MotionFeatures>
        <div role="img" aria-label={label} dir="ltr" data-slot="live-strip" className="relative h-20 overflow-hidden border-b border-line">
          <AnimatePresence initial={false}>
            {series.map((value, i) => {
              const id = bucket - (n - 1 - i)
              const now = i === n - 1
              return (
                <m.div
                  key={id}
                  data-yj-bucket={id}
                  data-yj-now={now || undefined}
                  className="absolute inset-y-0 start-0"
                  style={{ width: `${100 / n}%` }}
                  initial={{ x: `${n * 100}%`, opacity: 0 }}
                  animate={{ x: `${i * 100}%`, opacity: 1 }}
                  exit={{ x: '-100%', opacity: 0 }}
                  transition={glide}
                >
                  <m.span
                    className={cn('absolute inset-x-[16%] bottom-0 h-full origin-bottom rounded-t-xs', now ? 'bg-chart-1' : 'bg-[color-mix(in_oklab,var(--color-chart-1)_42%,var(--color-surface))]')}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: Math.min(1, value / top) }}
                    transition={grow}
                  />
                </m.div>
              )
            })}
          </AnimatePresence>
        </div>
      </MotionFeatures>
      <figcaption aria-hidden dir="ltr" className="flex justify-between text-ui-xs text-fg-subtle tabular-nums">
        <span>{ends[0]}</span>
        <span>{ends[1]}</span>
      </figcaption>
    </figure>
  )
}

export { Strip }
