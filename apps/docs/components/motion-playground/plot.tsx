'use client'

import { useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from 'react'
import { cn } from '@/lib/cn'

/* Progress over time, as the motion really runs. The reference curve is the
 * transition from rest, sampled from Motion's own solver; while the stage
 * plays, the live trace is drawn over it in the accent, and the head scrubs
 * along with the element on the stage. A trace that leaves the curve is the
 * truth: a spring retargeted mid-flight keeps its velocity. Time is in the
 * token's own milliseconds, so the axis reads the same at any Speed. */

export interface PlotHandle {
  /** Starts a new trace, at 0 ms. */
  begin(): void
  /** The next point of the trace: design milliseconds, and progress from the start (0) to the target (1). */
  point(t: number, value: number): void
  /** Hides the head (under reduced motion there is no trace to follow). */
  rest(): void
}

export interface PlotMarker {
  at: number
  label: string
}

const PAD = { top: 22, bottom: 24, start: 12, end: 16 }
const SAMPLES = 160

/** 0, 200, 400… for a horizon, about five labels wide. */
function ticks(horizon: number): number[] {
  const raw = horizon / 5
  const step = [50, 100, 200, 250, 500, 1000].find((s) => s >= raw) ?? 1000
  return Array.from({ length: Math.floor(horizon / step) + 1 }, (_, i) => i * step)
}

export function CurvePlot({
  sample,
  horizon,
  markers = [],
  bezier,
  height: H = 156,
  label,
  className,
  ref,
}: {
  /** Progress at t design milliseconds. */
  sample: (t: number) => number
  horizon: number
  markers?: PlotMarker[]
  /** A tween's control points, drawn as handles: the curve over `ms`. */
  bezier?: { curve: readonly [number, number, number, number]; ms: number }
  height?: number
  /** What the plot shows, for assistive tech. */
  label: string
  className?: string
  ref?: Ref<PlotHandle>
}) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const trace = useRef<SVGPathElement>(null)
  const head = useRef<SVGGElement>(null)
  const dot = useRef<SVGGElement>(null)
  const points = useRef('')

  useEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const values = useMemo(() => Array.from({ length: SAMPLES + 1 }, (_, i) => sample((i / SAMPLES) * horizon)), [sample, horizon])
  const handles = bezier ? [bezier.curve[1], bezier.curve[3]] : []
  const lo = Math.min(0, ...values, ...handles)
  const hi = Math.max(1, ...values, ...handles)
  const span = hi - lo || 1
  const inner = Math.max(1, width - PAD.start - PAD.end)
  const x = (t: number) => PAD.start + (Math.min(t, horizon) / horizon) * inner
  const y = (v: number) => PAD.top + (1 - (v - lo) / span) * (H - PAD.top - PAD.bottom)
  const scale = useRef({ x, y })
  scale.current = { x, y }

  const curve = values.map((v, i) => `${i ? 'L' : 'M'}${x((i / SAMPLES) * horizon).toFixed(1)} ${y(v).toFixed(1)}`).join('')
  const peak = values.reduce((best, v) => Math.max(best, v), 0)
  const overshoot = peak > 1.0005 ? peak - 1 : 0
  const peakX = x((values.indexOf(peak) / SAMPLES) * horizon)
  // The overshoot reads above its peak; under it, on the empty side of the curve, where a marker's label above would run into it.
  const crowded = markers.some((m) => Math.abs(x(m.at) - peakX) < 100)
  // "target" goes on whichever end of its line the markers and the overshoot label leave free, if either.
  const labels = [...markers.map((m) => x(m.at)), ...(overshoot > 0 ? [peakX] : [])]
  const targetSide = !labels.some((lx) => lx > width - 110) ? 'end' : !labels.some((lx) => lx < PAD.start + 80) ? 'start' : null

  useImperativeHandle(
    ref,
    () => ({
      begin() {
        points.current = ''
        trace.current?.setAttribute('d', '')
      },
      point(t, value) {
        const { x, y } = scale.current
        const px = x(t).toFixed(1)
        const py = y(value).toFixed(1)
        points.current += `${points.current ? 'L' : 'M'}${px} ${py}`
        trace.current?.setAttribute('d', points.current)
        if (head.current) {
          head.current.style.opacity = '1'
          head.current.style.transform = `translateX(${px}px)`
        }
        dot.current?.setAttribute('transform', `translate(0 ${py})`)
      },
      rest() {
        if (head.current) head.current.style.opacity = '0'
      },
    }),
    [],
  )

  // A resize redraws the axes; the trace so far no longer lines up, so it starts over.
  useEffect(() => {
    points.current = ''
    trace.current?.setAttribute('d', '')
    if (head.current) head.current.style.opacity = '0'
  }, [width, horizon, lo, hi])

  return (
    <div ref={box} className={cn('relative w-full', className)} role="img" aria-label={label}>
      {width > 0 && (
        <svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} className="block overflow-visible" aria-hidden>
          {/* Time. */}
          {ticks(horizon).map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1={PAD.top - 6} y2={H - PAD.bottom} className="stroke-line" strokeDasharray="2 4" />
              <text x={x(t)} y={H - 7} textAnchor={t === 0 ? 'start' : 'middle'} className="fill-fg-muted font-sans text-[10px] tabular-nums">
                {t === 0 ? '0' : t}
                {t === ticks(horizon).at(-1) ? ' ms' : ''}
              </text>
            </g>
          ))}
          {/* Rest and target. */}
          <line x1={PAD.start} x2={width - PAD.end} y1={y(0)} y2={y(0)} className="stroke-line-strong" />
          <line x1={PAD.start} x2={width - PAD.end} y1={y(1)} y2={y(1)} className="stroke-line-strong" strokeDasharray="4 3" />
          {targetSide && (
            <text
              x={targetSide === 'end' ? width - PAD.end : PAD.start + 2}
              y={y(1) - 5}
              textAnchor={targetSide === 'end' ? 'end' : 'start'}
              className="fill-fg-muted font-sans text-[10px]"
            >
              target
            </text>
          )}
          {markers.map((m) => {
            // A label near the end reads leftward, inside the plot.
            const flip = x(m.at) > width - 96
            return (
              <g key={m.label}>
                <line x1={x(m.at)} x2={x(m.at)} y1={PAD.top - 12} y2={H - PAD.bottom} className="stroke-fg-muted" strokeDasharray="1 3" />
                <text x={x(m.at) + (flip ? -4 : 4)} y={PAD.top - 6} textAnchor={flip ? 'end' : 'start'} className="fill-fg font-sans text-[10px] tabular-nums">
                  {m.label}
                </text>
              </g>
            )
          })}
          {overshoot > 0 && (
            <text
              x={peakX}
              y={crowded ? y(peak) + 17 : y(peak) - 6}
              textAnchor="middle"
              className="fill-accent font-sans text-[10px] font-medium tabular-nums"
            >
              +{(overshoot * 100).toFixed(1)}%
            </text>
          )}
          {bezier && (
            <g className="stroke-fg-subtle" strokeWidth={1}>
              <line x1={x(0)} y1={y(0)} x2={x(bezier.curve[0] * bezier.ms)} y2={y(bezier.curve[1])} />
              <line x1={x(bezier.ms)} y1={y(1)} x2={x(bezier.curve[2] * bezier.ms)} y2={y(bezier.curve[3])} />
              <circle cx={x(bezier.curve[0] * bezier.ms)} cy={y(bezier.curve[1])} r={3} className="fill-surface stroke-fg-muted" strokeWidth={1.25} />
              <circle cx={x(bezier.curve[2] * bezier.ms)} cy={y(bezier.curve[3])} r={3} className="fill-surface stroke-fg-muted" strokeWidth={1.25} />
            </g>
          )}
          <path d={curve} fill="none" className="stroke-fg-muted" strokeWidth={1.5} strokeLinejoin="round" />
          <path ref={trace} fill="none" className="stroke-accent" strokeWidth={2.25} strokeLinejoin="round" strokeLinecap="round" />
          <g ref={head} style={{ opacity: 0 }}>
            <line x1={0} x2={0} y1={PAD.top - 6} y2={H - PAD.bottom} className="stroke-accent-line" />
            <g ref={dot}>
              <circle r={8} className="fill-accent-subtle" />
              <circle r={4} className="fill-accent stroke-surface" strokeWidth={1.5} />
            </g>
          </g>
        </svg>
      )}
      {width === 0 && <div style={{ height: H }} />}
    </div>
  )
}
