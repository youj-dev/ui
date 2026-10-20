'use client'

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, useDirection, useYouj } from '@youj/core'
import { Counter } from '@youj/motion'
import { PlayIcon, RefreshIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { useVisible } from '../../../hooks/use-visible'
import { cn } from '../../../lib/utils'
import type { AboutCopy, AboutMetric, AboutMilestone } from './data'

/* The story as an instrument. A rail of years runs under a growth line drawn by the block; picking a year (a tab:
 * the arrows, Home and End move along the rail) rolls every figure to that year's value, draws the line up to it and
 * swaps the chapter in. In view it plays through the years once, the rail filling towards the next year as its
 * clock, holding while the pointer or keyboard focus is in it, off screen or in a hidden tab; a pick stops it, and
 * the button pauses, plays or plays it again from the start. The fill, the line and the point glide between years
 * from wherever they are. Reduced motion: no tour, the story rests on its last chapter and a pick swaps at once. */

/** Milliseconds a year is held while the story plays, before the Speed control. */
const DWELL = 2600

const curve = (points: readonly number[]) => `cubic-bezier(${points.join(',')})` // youj-allow: the token's own curve, for a Web Animation
const scaleOf = (el: HTMLElement) => {
  const transform = getComputedStyle(el).transform
  return transform && transform !== 'none' ? new DOMMatrixReadOnly(transform).a : 0
}

/** A smooth line through the points (Catmull-Rom as cubic Béziers), in the chart's 1000 × 160 box. */
function linePath(points: [number, number][]) {
  if (points.length < 2) return ''
  let d = `M${points[0]![0]},${points[0]![1]}`
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [points[i - 1] ?? points[i]!, points[i]!, points[i + 1]!, points[i + 2] ?? points[i + 1]!]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`
  }
  return d
}

interface TimelineProps {
  milestones: AboutMilestone[]
  metrics: AboutMetric[]
  /** The milestone shown. */
  index: number
  onChange: (index: number) => void
  autoAdvance: boolean
  copy: AboutCopy
  locale: string
  headingLevel: number
}

export function Timeline({ milestones, metrics, index, onChange, autoAdvance, copy, locale, headingLevel }: TimelineProps) {
  const k = useYouj()
  const rtl = useDirection() === 'rtl'
  const id = useId()
  const Chapter = `h${headingLevel}` as 'h3'
  const root = useRef<HTMLDivElement>(null)
  const fill = useRef<HTMLDivElement>(null)
  const clock = useRef<Animation | null>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const visible = useVisible(root)
  const last = milestones.length - 1
  const tours = autoAdvance && !k.reduced && last > 0
  const [playing, setPlaying] = useState(true)
  const [held, setHeld] = useState(false)
  const touring = tours && playing && index < last
  const shown = milestones[index] ?? milestones[last]!
  const charted = metrics.find((metric) => metric.chart) ?? metrics[1] ?? metrics[0]

  // The growth line: each year above its stop on the rail (the middle of its column), to scale, lifted a little off the
  // floor so the first years still show.
  const points = useMemo(() => {
    const values = milestones.map((ms) => (charted ? (ms.figures[charted.id] ?? 0) : 0))
    const top = Math.max(1, ...values)
    return values.map((v, i): [number, number] => [((i + 0.5) / milestones.length) * 1000, 142 - (Math.max(0, v) / top) * 126])
  }, [milestones, charted])
  const line = linePath(points)
  const area = line && `${line} L${points.at(-1)![0]},160 L${points[0]![0]},160 Z`
  const [px, py] = points[index] ?? [0, 0]

  // The rail's fill is the tour's clock: it grows towards the next year while one is held, and the tour moves on when
  // it gets there. Outside the tour it glides to the year picked, from wherever it is.
  useEffect(() => {
    const el = fill.current
    if (!el || typeof el.animate !== 'function' || last < 1 || k.reduced) return
    const at = scaleOf(el)
    if (touring) {
      const animation = el.animate([{ transform: `scaleX(${at})` }, { transform: `scaleX(${(index + 1) / last})` }], {
        duration: DWELL * k.timeScale,
        delay: index === 0 ? k.ms('deliberate') : 0,
        easing: 'linear',
        fill: 'forwards',
      })
      clock.current = animation
      animation.finished.then(
        () => onChange(index + 1),
        () => {},
      )
      return () => {
        clock.current = null
        animation.cancel()
      }
    }
    const animation = el.animate([{ transform: `scaleX(${at})` }, { transform: `scaleX(${index / last})` }], {
      duration: k.ms('slow'),
      easing: curve(k.ease('emphasized')),
      fill: 'forwards',
    })
    return () => animation.cancel()
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the tour restarts on its own inputs, not on a new onChange
  }, [touring, index, last, k])
  useEffect(() => {
    const animation = clock.current
    if (!animation) return
    if (held || !visible) animation.pause()
    else animation.play()
  }, [held, visible, touring, index])

  const pick = (next: number) => {
    setPlaying(false)
    if (next !== index) onChange(next)
  }
  const keys = (event: KeyboardEvent) => {
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[event.key]
    const next = step !== undefined ? Math.min(last, Math.max(0, index + step)) : event.key === 'Home' ? 0 : event.key === 'End' ? last : null
    if (next === null) return
    event.preventDefault()
    pick(next)
    tabs.current[next]?.focus()
  }
  const done = tours && index === last && playing

  return (
    <MotionFeatures>
      <div
        ref={root}
        onPointerEnter={() => setHeld(true)}
        onPointerLeave={() => setHeld(false)}
        onFocus={(event) => event.target.matches(':focus-visible') && setHeld(true)}
        onBlur={(event) => !event.currentTarget.contains(event.relatedTarget as Node | null) && setHeld(false)}
        className="flex flex-col gap-8 rounded-2xl border border-line bg-surface p-5 sm:p-8"
      >
        <div className="flex items-center justify-between gap-4">
          <p id={`${id}-label`} className="text-ui-sm font-medium text-fg-muted">
            {copy.timeline}
          </p>
          {tours && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={done ? copy.replay : touring ? copy.pause : copy.play}
              onClick={() => {
                if (done || (!playing && index === last)) onChange(0)
                setPlaying(done || !touring)
                setHeld(false)
              }}
              className="-me-1.5"
            >
              {done ? <RefreshIcon size={14} /> : <PlayIcon size={14} active={touring} />}
            </Button>
          )}
        </div>
        <div
          role="tabpanel"
          id={`${id}-panel`}
          aria-labelledby={`${id}-tab-${index}`}
          className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-end lg:gap-12"
        >
          <m.div
            key={index}
            className="flex min-h-32 flex-col justify-end gap-2.5"
            initial={k.reduced ? false : { opacity: 0, y: 6, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={k.tween('slow', 'enter')}
          >
            <p className="font-mono text-ui-sm text-fg-muted tabular-nums">{shown.label}</p>
            <Chapter className="text-balance text-2xl font-semibold tracking-tight">{shown.title}</Chapter>
            <p className="max-w-md text-pretty text-ui-lg text-fg-muted">{shown.description}</p>
          </m.div>
          {metrics.length > 0 && (
            <dl className="grid grid-cols-3 gap-4 sm:gap-6">
              {metrics.map((metric) => (
                <div key={metric.id} className="flex flex-col-reverse gap-1.5 border-s border-line ps-4">
                  <dt className="text-ui-sm text-fg-muted">{metric.label}</dt>
                  <dd className="flex items-baseline text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                    <Counter value={shown.figures[metric.id] ?? 0} mode="roll" format={metric.format} locale={locale} inView={false} />
                    {metric.suffix && <span className="ms-0.5 text-xl text-fg-muted">{metric.suffix}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="relative">
          {charted && (
            <div aria-hidden className="relative h-28 sm:h-36 rtl:-scale-x-100">
              <svg viewBox="0 0 1000 160" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
                <defs>
                  <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-fg)" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="var(--color-fg)" stopOpacity={0} />
                  </linearGradient>
                  <clipPath id={`${id}-past`}>
                    <m.rect
                      x="0"
                      y="-20"
                      height="200"
                      initial={false}
                      animate={{ width: px }}
                      transition={k.reduced ? { type: false } : k.spring('smooth')}
                    />
                  </clipPath>
                </defs>
                <path d={line} fill="none" className="stroke-line-strong" strokeWidth={1.5} strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
                <g clipPath={`url(#${id}-past)`}>
                  <path d={area} fill={`url(#${id}-area)`} />
                  <path d={line} fill="none" className="stroke-fg" strokeWidth={2} vectorEffect="non-scaling-stroke" />
                </g>
              </svg>
              <m.span
                className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-fg shadow-sm"
                initial={false}
                animate={{ left: `${px / 10}%`, top: `${(py / 160) * 100}%` }}
                transition={k.reduced ? { type: false } : k.spring('smooth')}
              />
            </div>
          )}
          <div
            role="tablist"
            aria-labelledby={`${id}-label`}
            onKeyDown={keys}
            className="relative grid pt-3"
            style={{ gridTemplateColumns: `repeat(${milestones.length}, minmax(0, 1fr))` }}
          >
            <span aria-hidden className="absolute top-4.5 h-px bg-line" style={{ insetInline: `calc(50% / ${milestones.length})` }}>
              <span
                ref={fill}
                className="absolute inset-0 origin-left bg-fg rtl:origin-right"
                style={{ transform: `scaleX(${last ? index / last : 0})` }}
              />
            </span>
            {milestones.map((ms, i) => (
              <button
                key={ms.id ?? ms.label}
                ref={(el) => {
                  tabs.current[i] = el
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${i}`}
                aria-selected={i === index}
                aria-controls={`${id}-panel`}
                aria-label={copy.milestoneName(ms.label, ms.title)}
                tabIndex={i === index ? 0 : -1}
                onClick={() => pick(i)}
                className="group/stop flex flex-col items-center gap-2.5 rounded-md pb-1 focus-ring"
              >
                <span
                  aria-hidden
                  className={cn(
                    'relative grid size-3 place-items-center rounded-full border transition-[background-color,border-color,scale] yj-duration-base ease-standard',
                    i < index && 'border-fg bg-fg',
                    i === index && 'scale-125 border-fg bg-surface',
                    i > index && 'border-line-strong bg-surface group-hover/stop:border-fg',
                  )}
                >
                  {i === index && <span className="size-1.5 rounded-full bg-fg" />}
                </span>
                <span
                  className={cn(
                    'font-mono text-ui-xs tabular-nums transition-colors yj-duration-fast ease-standard',
                    i === index ? 'text-fg' : 'text-fg-muted group-hover/stop:text-fg',
                  )}
                >
                  {ms.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </MotionFeatures>
  )
}
