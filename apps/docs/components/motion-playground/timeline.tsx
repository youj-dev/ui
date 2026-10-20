'use client'

import { useImperativeHandle, useRef, type ReactNode, type Ref } from 'react'
import { cn } from '@/lib/cn'

/* When each part moves, on one time axis: a bar per part from its start to
 * where it lands, filled along its own curve as the playhead passes, so a
 * cascade reads as a staircase and an exit as the short bar it should be. A
 * part with no duration (reduced motion) is a tick at the moment it changes. */

export interface TimelineRow {
  label: ReactNode
  /** Design milliseconds from the start of the run. */
  start: number
  duration: number
  /** Progress at local design milliseconds since the row started (may overshoot). */
  sample: (t: number) => number
  /** Mono text at the row's end: "fast · exit". */
  detail?: string
}

export interface TimelineHandle {
  at(t: number): void
}

/** An axis for at least `span` ms, ending on a round tick: 0, 100, 200… */
function axisFor(span: number): { end: number; ticks: number[] } {
  const step = [50, 100, 200, 250, 500, 1000].find((s) => s >= span / 5) ?? 1000
  const end = Math.max(step, Math.ceil(span / step) * step)
  return { end, ticks: Array.from({ length: end / step + 1 }, (_, i) => i * step) }
}

export function Timeline({ rows, horizon: span, label, ref }: { rows: TimelineRow[]; horizon: number; label: string; ref?: Ref<TimelineHandle> }) {
  const fills = useRef<(HTMLSpanElement | null)[]>([])
  const head = useRef<HTMLSpanElement>(null)
  const { end: horizon, ticks: axis } = axisFor(span)
  const pct = (ms: number) => `${(Math.min(Math.max(ms, 0), horizon) / horizon) * 100}%`

  useImperativeHandle(
    ref,
    () => ({
      at(t) {
        rows.forEach((row, i) => {
          const fill = fills.current[i]
          if (!fill) return
          const local = t - row.start
          const p = row.duration === 0 ? (local >= 0 ? 1 : 0) : local <= 0 ? 0 : Math.max(0, Math.min(1, row.sample(Math.min(local, row.duration))))
          fill.style.transform = row.duration === 0 ? `scale(${p})` : `scaleX(${p})`
        })
        if (head.current) {
          // The head shows while something is still moving.
          const end = Math.max(...rows.map((row) => row.start + row.duration))
          head.current.style.opacity = t > 0 && t < end ? '1' : '0'
          head.current.style.insetInlineStart = pct(t)
        }
      },
    }),
    [rows, horizon],
  )

  return (
    <div role="img" aria-label={label} className="flex gap-3 py-2">
      <div className="flex shrink-0 flex-col gap-1.5">
        {rows.map((row, i) => (
          <span key={i} className="flex h-5 max-w-32 items-center truncate text-[12px] text-fg-muted">
            {row.label}
          </span>
        ))}
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="flex flex-col gap-1.5">
          {rows.map((row, i) => (
            <div key={i} className="relative h-5">
              <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-line" />
              {row.duration > 0 ? (
                <span
                  aria-hidden
                  className="absolute top-1 bottom-1 overflow-hidden rounded-[4px] border border-line-strong bg-surface"
                  style={{ insetInlineStart: pct(row.start), width: `max(${pct(row.duration)}, 3px)` }}
                >
                  <span
                    ref={(el) => {
                      fills.current[i] = el
                    }}
                    className="absolute inset-0 origin-left bg-accent rtl:origin-right"
                    style={{ transform: 'scaleX(0)' }}
                  />
                </span>
              ) : (
                // Instant: a diamond where the state changes, filled once it has.
                <span
                  aria-hidden
                  className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] border border-fg bg-surface rtl:translate-x-1/2"
                  style={{ insetInlineStart: pct(row.start) }}
                >
                  <span
                    ref={(el) => {
                      fills.current[i] = el
                    }}
                    className="absolute inset-0 bg-accent"
                    style={{ transform: 'scale(0)' }}
                  />
                </span>
              )}
            </div>
          ))}
        </div>
        <div aria-hidden className="relative mt-1.5 h-4">
          {axis.map((t) => (
            <span
              key={t}
              className={cn(
                'absolute top-0 font-sans text-[10px] whitespace-nowrap text-fg-muted tabular-nums',
                t === axis.at(-1) && t > 0 ? '-translate-x-full rtl:translate-x-full' : t > 0 && '-translate-x-1/2 rtl:translate-x-1/2',
              )}
              style={{ insetInlineStart: pct(t) }}
            >
              {t}
              {t === axis.at(-1) ? ' ms' : ''}
            </span>
          ))}
        </div>
        <span ref={head} aria-hidden className="absolute top-0 bottom-5 w-px bg-accent opacity-0" />
      </div>
      <div className="hidden shrink-0 flex-col gap-1.5 sm:flex">
        {rows.map((row, i) => (
          <span key={i} className="flex h-5 items-center justify-end font-sans text-[10.5px] whitespace-nowrap text-fg-muted tabular-nums">
            {row.detail}
          </span>
        ))}
      </div>
    </div>
  )
}
