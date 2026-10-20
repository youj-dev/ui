'use client'

import { useId, useMemo, useRef, type CSSProperties } from 'react'
import { m, useInView } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'

/* A tile's line: the period as a smooth monotone curve (it never
 * overshoots a reading) over a wash, the period before as a dashed ghost on
 * the same scale, and, when the last bucket is still filling, its segment
 * dashed. The crosshair (a hairline, a dot on the line and a ring on the
 * ghost) sits wherever the board's pointer or keys are. It draws in left to
 * right when it scrolls into view, morphs point by point when the readings
 * change (a new count of points draws in again), and under reduced motion
 * it is drawn in place. Time reads left to right in either direction. */

const W = 100
const H = 40
/** Headroom so the stroke and the dot are never clipped at the extremes. */
const PAD = 5

const f = (n: number) => (Math.round(n * 100) / 100).toString()

/** Fritsch–Carlson monotone cubic through the points: one `C` command per segment. */
function segments(points: [number, number][]) {
  const n = points.length
  if (n < 2) return []
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
  return points.slice(0, -1).map(([x0, y0], i) => {
    const [x1, y1] = points[i + 1]!
    const h = dx[i]! / 3
    return ` C${f(x0 + h)},${f(y0 + tangent[i]! * h)} ${f(x1 - h)},${f(y1 - tangent[i + 1]! * h)} ${f(x1)},${f(y1)}`
  })
}

interface TrendProps {
  data: number[]
  previous?: number[]
  /** The last bucket is still filling: its segment dashed. */
  partial: boolean
  color: string
  /** The bucket under the crosshair. */
  active: number | null
}

function Trend({ data, previous, partial, color, active }: TrendProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const shown = k.reduced || inView
  const wash = `wash-${useId().replace(/:/g, '')}`

  const shape = useMemo(() => {
    const all = [...data, ...(previous ?? [])]
    const lo = Math.min(...all)
    const hi = Math.max(...all)
    const span = hi - lo || 1
    const n = data.length
    const x = (i: number) => (n > 1 ? (i / (n - 1)) * W : W / 2)
    const y = (v: number) => PAD + (1 - (v - lo) / span) * (H - PAD * 2)
    const pts = data.map((v, i): [number, number] => [x(i), y(v)])
    const segs = segments(pts)
    const start = pts[0] ? `M${f(pts[0][0])},${f(pts[0][1])}` : ''
    const cut = partial && segs.length > 0 ? segs.length - 1 : segs.length
    const before = previous?.slice(0, n).map((v, i): [number, number] => [x(i), y(v)]) ?? []
    return {
      line: start + segs.slice(0, cut).join(''),
      tail: partial && pts.length > 1 ? `M${f(pts[cut]![0])},${f(pts[cut]![1])}${segs[cut]}` : '',
      area: pts.length > 1 ? `${start}${segs.join('')} L${W},${H} L0,${H} Z` : '',
      ghost: before.length > 1 ? `M${f(before[0]![0])},${f(before[0]![1])}${segments(before).join('')}` : '',
      at: (i: number) => ({ x: (x(i) / W) * 100, y: (y(data[i] ?? lo) / H) * 100, ghost: previous?.[i] === undefined ? undefined : (y(previous[i]!) / H) * 100 }),
    }
  }, [data, previous, partial])

  const morph = k.reduced ? { type: false as const } : k.tween('slow', 'standard')
  const point = active === null ? null : shape.at(active)

  return (
    <MotionFeatures>
      <div ref={ref} aria-hidden dir="ltr" data-slot="kpi-trend" className="relative h-12 w-full" style={{ '--line': color } as CSSProperties}>
        {/* A new count of points draws in again; the same count morphs. */}
        <m.svg
          key={data.length}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
          initial={k.reduced ? false : { clipPath: 'inset(-20% 100% -20% 0)' }}
          animate={shown ? { clipPath: 'inset(-20% -4% -20% 0)' } : undefined}
          transition={k.reduced ? { type: false } : k.tween('deliberate', 'enter')}
        >
          <defs>
            <linearGradient id={wash} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--line)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--line)" stopOpacity={0} />
            </linearGradient>
          </defs>
          {shape.ghost && (
            <m.path initial={false} animate={{ d: shape.ghost }} transition={morph} fill="none" stroke="var(--color-fg-subtle)" strokeWidth={1.25} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          )}
          {shape.area && <m.path initial={false} animate={{ d: shape.area }} transition={morph} fill={`url(#${wash})`} stroke="none" />}
          <m.path initial={false} animate={{ d: shape.line }} transition={morph} fill="none" stroke="var(--line)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {shape.tail && (
            <m.path initial={false} animate={{ d: shape.tail }} transition={morph} fill="none" stroke="var(--line)" strokeWidth={1.75} strokeDasharray="2.5 3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          )}
        </m.svg>
        {point && (
          <>
            <span data-slot="kpi-crosshair" className="absolute inset-y-0 w-px -translate-x-1/2 bg-line-strong" style={{ left: `${point.x}%` }} />
            {point.ghost !== undefined && (
              <span className="absolute size-2 -translate-1/2 rounded-full border-[1.5px] border-fg-subtle bg-surface" style={{ left: `${point.x}%`, top: `${point.ghost}%` }} />
            )}
            <span className="absolute size-2.5 -translate-1/2 rounded-full bg-(--line) ring-2 ring-surface" style={{ left: `${point.x}%`, top: `${point.y}%` }} />
          </>
        )}
      </div>
    </MotionFeatures>
  )
}

export { Trend }
