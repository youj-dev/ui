'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { m } from 'motion/react'
import { MotionFeatures } from '@youj/core'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useResizeMeasure } from '../../../hooks/use-resize-measure'
import { cn } from '../../../lib/utils'
import { SWEEP, angleOf, dialLayout, polar, ringRadius, segmentPath } from './geometry'
import { stepSelection, toneFill, type WeekSlot, type WeekDialTone } from './model'

/* The week as a dial: one ring per weekday, Monday outermost, the hours shown
 * running clockwise over three quarters of a circle, the first at nine
 * o'clock. Each entry is an arc in its kind's color on its day's quiet track,
 * with a hairline at each labelled hour. The weekday initials sit under the
 * start of their rings, today's in full strength. When the clock is inside the
 * hours, a hand crosses every ring at the time, labelled beyond the outer ring.
 * The middle gives the headline figure. One tab stop: the arrow keys read an
 * entry at a time, Escape lets go. */

const MAX = 380
const MARGIN = 26
const CORNER = 4
/** The corner of the outline round the arc being read. */
const RING = 5

interface DialProps {
  /** One per ring, outermost first; `initial` is the weekday's narrow name. */
  columns: readonly { day: string; initial: string; today: boolean }[]
  slots: readonly WeekSlot[]
  /** The hours shown, as minutes after midnight. */
  shown: readonly [number, number]
  ticks: readonly { minute: number; label: string }[]
  now?: { column: number; minute: number; label: string }
  center: { value: string; label: string; tone: WeekDialTone }
  active: number | null
  onActiveChange: (index: number | null) => void
  label: string
  summaryId: string
}

function Dial({ columns, slots, shown, ticks, now, center, active, onActiveChange, label, summaryId }: DialProps) {
  const k = useYouj()
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useResizeMeasure(ref, (el) => setWidth(el.clientWidth))
  const size = Math.min(width, MAX)
  const layout = dialLayout(size, columns.length, MARGIN)
  const { cx, cy } = layout
  const angle = (minute: number) => angleOf(minute, shown[0], shown[1])
  // The hour labels give way to the now label where they would touch it.
  const pixelsPerMinute = (((SWEEP * Math.PI) / 180) * (layout.outer + 14)) / (shown[1] - shown[0])
  const nearNow = (minute: number) => now !== undefined && Math.abs(minute - now.minute) * pixelsPerMinute < 34

  const keys = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = stepSelection(active, event.key, slots.length)
    if (next === undefined || (next === null && active === null)) return
    event.preventDefault()
    onActiveChange(next)
  }

  const tip = now ? polar(cx, cy, layout.outer + 10, angle(now.minute)) : undefined
  const handAngle = now ? angle(now.minute) : 0
  const side = Math.sin((handAngle * Math.PI) / 180)

  return (
    <div
      ref={ref}
      // A clock turns clockwise in every script.
      dir="ltr"
      role="group"
      aria-roledescription="chart"
      aria-label={label}
      aria-describedby={summaryId}
      tabIndex={0}
      data-slot="week-dial-dial"
      className="relative mx-auto aspect-square w-full touch-pan-y rounded-md outline-hidden select-none focus-ring"
      style={{ maxWidth: MAX }}
      onPointerLeave={() => onActiveChange(null)}
      onBlur={() => onActiveChange(null)}
      onKeyDown={keys}
    >
      {width > 0 && (
        <MotionFeatures>
          <svg aria-hidden width={size} height={size} className="block overflow-visible">
            {/* The tracks, then a hairline at each labelled hour. */}
            <g className="fill-fg stroke-fg opacity-5">
              {columns.map((c, i) => (
                <path
                  key={c.day}
                  d={segmentPath(cx, cy, ringRadius(layout, i), layout.width, -90, 180, CORNER)}
                  strokeWidth={CORNER * 2}
                  strokeLinejoin="round"
                />
              ))}
            </g>
            {ticks.map((t) => {
              const a = polar(cx, cy, layout.inner, angle(t.minute))
              const b = polar(cx, cy, layout.outer, angle(t.minute))
              return <line key={t.minute} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="stroke-line-subtle" strokeWidth={1} />
            })}

            {slots.map((slot, index) => {
              const r = ringRadius(layout, slot.column)
              const from = angle(slot.from)
              const to = angle(slot.to)
              const fill = toneFill(slot.kind.tone)
              return (
                <g key={index} data-slot="week-dial-arc" data-yj-kind={slot.kind.id} data-active={index === active || undefined}>
                  {index === active && (
                    <path
                      d={segmentPath(
                        cx,
                        cy,
                        r,
                        layout.width + 6 + 2 * RING,
                        from - ((3 + RING) / r) * (180 / Math.PI),
                        to + ((3 + RING) / r) * (180 / Math.PI),
                        RING,
                      )}
                      fill="none"
                      strokeWidth={1.5}
                      strokeLinejoin="round"
                      className="stroke-fg"
                    />
                  )}
                  <m.path
                    d={segmentPath(cx, cy, r, layout.width, from, to, CORNER)}
                    strokeWidth={CORNER * 2}
                    strokeLinejoin="round"
                    className="transition-opacity yj-duration-fast ease-standard"
                    style={{ fill, stroke: fill, opacity: active !== null && index !== active ? 0.45 : 1, transformOrigin: `${cx}px ${cy}px` }}
                    initial={k.reduced ? false : { scale: 0.94 }}
                    animate={{ scale: 1 }}
                    transition={{ ...k.tween('slow', 'enter'), delay: k.reduced ? 0 : (slot.column * 3 + (index % 3)) * 0.03 }}
                    onPointerEnter={() => onActiveChange(index)}
                    onPointerDown={() => onActiveChange(index)}
                  />
                </g>
              )
            })}

            {/* Weekday initials under the start of each ring. */}
            {columns.map((c, i) => (
              <text
                key={c.day}
                x={cx - ringRadius(layout, i)}
                y={cy + 15}
                textAnchor="middle"
                className={cn('text-ui-xs tabular-nums', c.today ? 'fill-fg font-medium' : 'fill-fg-muted')}
              >
                {c.initial}
              </text>
            ))}

            {ticks.map((t) => {
              if (nearNow(t.minute)) return null
              const p = polar(cx, cy, layout.outer + 14, angle(t.minute))
              return (
                <text key={t.minute} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" className="fill-fg-muted text-ui-xs tabular-nums">
                  {t.label}
                </text>
              )
            })}

            {now && tip && (
              <g data-slot="week-dial-now">
                <line
                  x1={polar(cx, cy, layout.inner - layout.step * 0.15, handAngle).x}
                  y1={polar(cx, cy, layout.inner - layout.step * 0.15, handAngle).y}
                  x2={tip.x}
                  y2={tip.y}
                  className="stroke-fg"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
                <text
                  x={tip.x + (side > 0.3 ? 5 : side < -0.3 ? -5 : 0)}
                  y={tip.y - (Math.abs(side) <= 0.3 ? 8 : 0) - (Math.cos((handAngle * Math.PI) / 180) > 0.3 ? 3 : 0)}
                  textAnchor={side > 0.3 ? 'start' : side < -0.3 ? 'end' : 'middle'}
                  dominantBaseline="central"
                  className="fill-fg stroke-surface text-ui-xs font-medium tabular-nums [paint-order:stroke]"
                  strokeWidth={4}
                  strokeLinejoin="round"
                >
                  {now.label}
                </text>
              </g>
            )}

            <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="central" className="fill-fg text-xl font-semibold tabular-nums">
              {center.value}
            </text>
            <text
              x={cx}
              y={cy + 16}
              textAnchor="middle"
              dominantBaseline="central"
              className={cn('text-ui-xs', center.tone === 'accent' ? 'fill-accent-text' : 'fill-fg-muted')}
            >
              {center.label}
            </text>
          </svg>
        </MotionFeatures>
      )}
    </div>
  )
}

export { Dial }
