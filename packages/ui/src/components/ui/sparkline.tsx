'use client'

import { useId, useMemo, useRef, type ComponentProps, type CSSProperties } from 'react'
import { m, useInView } from 'motion/react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { cn } from '../../lib/utils'
import { MotionFeatures } from '@youj/core'

/* A word-sized trend line for a KPI or a table cell: a smooth monotone curve
 * (it never overshoots a data point), a wash under it and a dot on the latest
 * value. Plain SVG, so it costs nothing next to a full chart and renders on
 * the server.
 * - Entrance: when it scrolls into view the curve and its wash are revealed
 *   left to right on the deliberate token (enter curve), and the end dot lands
 *   on the settle spring once the line reaches it.
 * - Data change: the curve morphs point by point on the slow token and the dot
 *   glides to the new latest value; a change mid-morph continues from where
 *   the curve is.
 * - Reduced motion: drawn in place, changes jump.
 * It stretches to its box (give it a height, e.g. `h-8`); the stroke keeps its
 * width at any size. With `label` it is an image with that name; without, it
 * is decorative. */

const W = 100
const H = 32
/** Headroom so the stroke and the dot are never clipped at the extremes. */
const PAD = 3

interface SparklineProps extends Omit<ComponentProps<'div'>, 'children' | 'color'> {
  data: readonly number[]
  /** Any CSS color. Default: the first chart color, which follows the theme. */
  color?: string
  /** A wash under the curve. Default true. */
  area?: boolean
  /** A dot on the latest value. Default true. */
  dot?: boolean
  /** Fixes the value range (e.g. `[0, 100]`), so separate sparklines compare. Default: the data's own range. */
  domain?: [number, number]
  /** Accessible name, e.g. "Revenue, last 30 days, rising". Without it the sparkline is decorative. */
  label?: string
}

/** Fritsch–Carlson monotone cubic through the points, as an SVG path. */
function monotone(points: [number, number][]) {
  const n = points.length
  if (n === 0) return ''
  if (n === 1) return `M${f(points[0]![0])},${f(points[0]![1])}`
  const dx: number[] = []
  const slope: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1]![0] - points[i]![0])
    slope.push((points[i + 1]![1] - points[i]![1]) / (dx[i] || 1))
  }
  const tangent: number[] = [slope[0]!]
  for (let i = 1; i < n - 1; i++) {
    const a = slope[i - 1]!
    const b = slope[i]!
    tangent.push(a * b <= 0 ? 0 : (3 * (dx[i - 1]! + dx[i]!)) / ((2 * dx[i]! + dx[i - 1]!) / a + (dx[i]! + 2 * dx[i - 1]!) / b))
  }
  tangent.push(slope[n - 2]!)
  let d = `M${f(points[0]![0])},${f(points[0]![1])}`
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i]!
    const [x1, y1] = points[i + 1]!
    const h = dx[i]! / 3
    d += ` C${f(x0 + h)},${f(y0 + tangent[i]! * h)} ${f(x1 - h)},${f(y1 - tangent[i + 1]! * h)} ${f(x1)},${f(y1)}`
  }
  return d
}

const f = (n: number) => (Math.round(n * 100) / 100).toString()

function Sparkline({ data, color = 'var(--color-chart-1)', area = true, dot = true, domain, label, className, style, ...props }: SparklineProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const shown = k.reduced || inView
  const gradient = `spark-${useId().replace(/:/g, '')}`

  const { line, fill, end } = useMemo(() => {
    const [lo, hi] = domain ?? [Math.min(...data), Math.max(...data)]
    const span = hi - lo || 1
    const step = data.length > 1 ? W / (data.length - 1) : 0
    const points = data.map((v, i): [number, number] => [i * step, PAD + (1 - (v - lo) / span) * (H - PAD * 2)])
    const path = monotone(points)
    const last = points[points.length - 1]
    return { line: path, fill: path && `${path} L${W},${H} L0,${H} Z`, end: last ? last[1] / H : 0.5 }
  }, [data, domain])

  const morph = k.reduced ? { type: false as const } : k.tween('slow', 'standard')

  return (
    <MotionFeatures>
      <div
        ref={ref}
        data-slot="sparkline"
        role={label ? 'img' : undefined}
        aria-label={label}
        aria-hidden={label ? undefined : true}
        // A trend reads left to right in either direction of text.
        dir="ltr"
        className={cn('relative h-8 w-full min-w-12', className)}
        style={{ '--spark': color, ...style } as CSSProperties}
        {...props}
      >
        <m.svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
          initial={k.reduced ? false : { clipPath: 'inset(-10% 100% -10% 0)' }}
          animate={shown ? { clipPath: 'inset(-10% -2% -10% 0)' } : undefined}
          transition={k.reduced ? { type: false } : k.tween('deliberate', 'enter')}
        >
          {area && (
            <>
              <defs>
                <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--spark)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--spark)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <m.path initial={false} animate={{ d: fill }} transition={morph} fill={`url(#${gradient})`} stroke="none" />
            </>
          )}
          <m.path
            initial={false}
            animate={{ d: line }}
            transition={morph}
            fill="none"
            stroke="var(--spark)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </m.svg>
        {dot && data.length > 0 && (
          // A full-size layer moved by a percentage of its own height, so the dot
          // tracks the value with a transform and stays round at any aspect.
          <m.span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={false}
            animate={{ y: `${end * 100}%` }}
            transition={morph}
          >
            <m.span
              data-slot="sparkline-dot"
              className="absolute -end-[3px] -top-[3px] size-1.5 rounded-full bg-(--spark) ring-2 ring-surface"
              initial={k.reduced ? false : { scale: 0 }}
              animate={shown ? { scale: 1 } : undefined}
              transition={k.reduced ? { type: false } : { ...k.spring('settle'), delay: k.duration('deliberate') * 0.7 }}
            />
          </m.span>
        )}
      </div>
    </MotionFeatures>
  )
}

export { Sparkline, type SparklineProps }
