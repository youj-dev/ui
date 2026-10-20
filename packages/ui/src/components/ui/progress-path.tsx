'use client'

import { animate, m, useInView } from 'motion/react'
import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from 'react'
import { MotionFeatures, useSoundCue } from '@youj/core'
import { CheckIcon, CrownIcon, LockIcon, StarIcon, TrophyIcon } from '@youj/icons'
import { progressPathLabels, useComponentLabels } from '@youj/core/labels'
import { useYouj, useLocale } from '@youj/core/lib/youj/provider'
import { clamp, cn, numberFormat, toneColor } from '../../lib/utils'
import { useResizeMeasure } from '../../hooks/use-resize-measure'
import { ShareBar } from './share-bar'

/* A course as a trail: lessons are nodes along a winding path, grouped into
 * sections that each take a chart color, with a trophy milestone closing a
 * section. Every node wears a segmented ring, one segment per level of
 * mastery. Lessons before the current one are done (a tinted disc with a
 * check, a crown once every level is mastered), the current one is an ink
 * disc glowing in its section's color with a "Start" callout over it, and
 * the rest are locked. The trail is solid where you've walked it and dotted
 * ahead.
 * - Keyboard: the nodes are one tab stop, starting on the current lesson. Up
 *   and down (and left and right, mirrored in RTL) walk the path, Home and
 *   End jump to its ends, and Enter opens a lesson; a locked one only says so.
 * - Motion: on first view the walked trail draws itself segment by segment.
 *   When the current lesson moves on, the next segment draws, the callout
 *   glides after it and the new node's glow comes up; the glow pings slowly
 *   while it's on screen. Reduced motion: drawn in place, no ping.
 * - RTL mirrors the path; the trail still reads from the top. */

type ProgressPathTone = 'accent' | 'neutral' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'

interface ProgressPathLesson {
  id: string
  title: string
  /** A mono line beside the title: "8 min", "+20 XP". */
  detail?: string
  /** Levels mastered, from 0 up to `levels`. Default 0. */
  mastery?: number
  /** Closes a section: drawn as a trophy and spoken as a milestone. */
  milestone?: boolean
}

interface ProgressPathSection {
  id: string
  title: string
  /** A mono capital over the title: "Section 2". */
  eyebrow?: string
  /** Default: the chart colors in turn. */
  tone?: ProgressPathTone
  lessons: ProgressPathLesson[]
}

interface ProgressPathProps extends Omit<ComponentProps<'div'>, 'children' | 'onSelect'> {
  sections: ProgressPathSection[]
  /** The lesson up next: those before it are done and those after it locked. `null` when the course is finished. Default: the first lesson not fully mastered. */
  current?: string | null
  /** Levels of mastery per lesson, one ring segment each. Default 4. */
  levels?: number
  /** Called when a lesson that isn't locked is opened. */
  onSelect?: (lesson: ProgressPathLesson, section: ProgressPathSection) => void
  /** Accessible name. Default: the labels' "Progress path". */
  label?: string
  /** Default: the YoujProvider locale. */
  locale?: string
  /** Plays the success cue when the current lesson moves on. Default true. */
  sound?: boolean
}

type Status = 'done' | 'current' | 'locked'

/* Geometry, in px. The path swings wider as the container grows. */
const COLUMN = 288
const PITCH = 92
const HEAD = 84
const SWING = { min: 58, max: 170, share: 0.24 }
const NODE = 60
const RING = { r: 27, width: 3.5 }

const TONES: ProgressPathTone[] = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']
const toneVar = (tone: ProgressPathTone) => toneColor(tone, 'var(--color-fg-muted)')

const f = (n: number) => Math.round(n * 100) / 100
function polar(r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180
  return [f(r * Math.cos(rad)), f(r * Math.sin(rad))]
}
function arc(r: number, from: number, to: number) {
  const [ax, ay] = polar(r, from)
  const [bx, by] = polar(r, to)
  return `M${ax},${ay} A${r},${r} 0 ${to - from > 180 ? 1 : 0} 1 ${bx},${by}`
}

/** The segment of a smooth curve through `points` from point i to i + 1 (Catmull–Rom as cubic Béziers). */
function segment(points: [number, number][], i: number) {
  const p0 = points[Math.max(0, i - 1)]!
  const p1 = points[i]!
  const p2 = points[i + 1]!
  const p3 = points[Math.min(points.length - 1, i + 2)]!
  const t = 1 / 6
  const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t]
  const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t]
  return `M${f(p1[0])},${f(p1[1])} C${f(c1[0]!)},${f(c1[1]!)} ${f(c2[0]!)},${f(c2[1]!)} ${f(p2[0])},${f(p2[1])}`
}

function ProgressPath({
  sections,
  current: currentProp,
  levels = 4,
  onSelect,
  label,
  locale: localeProp,
  sound = true,
  className,
  style,
  ...props
}: ProgressPathProps) {
  const k = useYouj()
  const labels = useComponentLabels(progressPathLabels)
  const locale = useLocale(localeProp)
  const cue = useSoundCue()
  const hintId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const refs = useRef(new Map<string, HTMLButtonElement>())
  const inView = useInView(ref, { once: true, amount: 0.15 })
  const live = useInView(ref, { amount: 0.1 })
  const shown = k.reduced || inView
  const [active, setActive] = useState<string>()
  // The walked trail draws segment by segment on the first reveal only; later steps draw at once.
  const [entered, setEntered] = useState(false)
  const num = numberFormat(locale)
  // The path's width, measured, so the trail can wind across all of it; a fixed column until then.
  const [width, setWidth] = useState(COLUMN)
  useResizeMeasure(ref, (el) => setWidth(el.getBoundingClientRect().width || COLUMN))
  const swing = clamp(width * SWING.share, SWING.min, SWING.max)

  // Lay the course out: a head per section, then its nodes swinging either side of the center line.
  const all = sections.flatMap((s) => s.lessons)
  const firstOpen = all.find((l) => (l.mastery ?? 0) < levels)?.id ?? null
  const currentId = currentProp === undefined ? firstOpen : currentProp
  const currentIndex =
    currentId === null
      ? all.length
      : Math.max(
          0,
          all.findIndex((l) => l.id === currentId),
        )
  let y = 0
  let index = 0
  const layout = sections.map((section, s) => {
    const tone = toneVar(section.tone ?? TONES[s % TONES.length]!)
    const head = y
    y += HEAD
    const nodes = section.lessons.map((lesson, j) => {
      const at = index++
      const status: Status = at < currentIndex ? 'done' : at === currentIndex ? 'current' : 'locked'
      return {
        lesson,
        section,
        at,
        status,
        x: f(Math.sin((j * Math.PI) / 2) * swing),
        y: y + j * PITCH + PITCH / 2,
        side: 'start' as 'start' | 'end',
      }
    })
    // A title sits on the node's outer side; on the center line, on the side the trail doesn't take.
    nodes.forEach((n, j) => {
      const toward = n.x || (nodes[j + 1] ?? nodes[j - 1])?.x || -1
      n.side = (n.x || -toward) > 0 ? 'start' : 'end'
    })
    y += section.lessons.length * PITCH
    return { section, tone, head, nodes, done: nodes.filter((n) => n.status === 'done').length }
  })
  const height = y
  const nodes = layout.flatMap((l) => l.nodes)
  const current = nodes.find((n) => n.status === 'current')
  const tabStop = nodes.some((n) => n.lesson.id === active) ? active : (current?.lesson.id ?? nodes[0]?.lesson.id)
  // The callout sits beside the current node, on the side away from its title and clear of the trail.
  const callout = current?.side ?? 'start'

  // The success cue as the current lesson moves on (not on the first render).
  const previous = useRef(currentIndex)
  useEffect(() => {
    if (sound && currentIndex > previous.current) cue('success')
    previous.current = currentIndex
  }, [currentIndex, sound, cue])

  const step = k.reduced ? 0 : k.duration('fast')
  useEffect(() => {
    if (!shown || entered) return
    const timer = setTimeout(() => setEntered(true), (nodes.length * step + k.duration('slow')) * 1000)
    return () => clearTimeout(timer)
  }, [shown, entered, nodes.length, step, k])
  const spoken = (status: Status) => (status === 'done' ? labels.lessonDone : status === 'current' ? labels.lessonCurrent : labels.lessonLocked)

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLElement).dataset.lessonId
    const i = nodes.findIndex((n) => n.lesson.id === id)
    if (i < 0) return
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl'
    const moves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }
    const forward = moves[e.key]
    const next = forward ? nodes[i + forward] : e.key === 'Home' ? nodes[0] : e.key === 'End' ? nodes.at(-1) : undefined
    if (!next || next.lesson.id === id) return
    e.preventDefault()
    setActive(next.lesson.id)
    const el = refs.current.get(next.lesson.id)
    el?.focus()
    el?.scrollIntoView?.({ block: 'nearest', behavior: k.reduced ? 'auto' : 'smooth' })
  }

  return (
    <MotionFeatures>
      <div
        ref={ref}
        role="group"
        aria-label={label ?? labels.progressPath}
        aria-describedby={hintId}
        data-slot="progress-path"
        data-reduced-motion={k.reduced || undefined}
        className={cn('@container/progress-path relative w-full [--lp-dir:1] rtl:[--lp-dir:-1]', className)}
        style={{ height, ...style }}
        onKeyDown={onKeyDown}
        {...props}
      >
        <span id={hintId} className="sr-only">
          {labels.progressPathHint}
        </span>

        <div aria-hidden className="pointer-events-none absolute inset-0">
          <svg
            data-slot="progress-path-trail"
            viewBox={`${-width / 2} 0 ${width} ${height}`}
            className="own:block h-full w-full overflow-visible rtl:-scale-x-100"
          >
            {/* The trail stops short of each node, so it never shows through a disc or its ring. */}
            <mask id={`${hintId}-trail`} maskUnits="userSpaceOnUse" x={-width / 2} y={0} width={width} height={height}>
              <rect x={-width / 2} y={0} width={width} height={height} fill="white" />
              {nodes.map((n) => (
                <circle key={n.lesson.id} cx={n.x} cy={n.y} r={NODE / 2 + 4} fill="black" />
              ))}
            </mask>
            <g mask={`url(#${hintId}-trail)`}>
              {layout.map(({ section, tone, nodes: list }) => {
                const points = list.map((n) => [n.x, n.y] as [number, number])
                return (
                  <g key={section.id} style={{ '--lp-tone': tone } as CSSProperties}>
                    {points.slice(1).map((_, i) => (
                      <path
                        key={`ahead-${i}`}
                        d={segment(points, i)}
                        fill="none"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeDasharray="0.1 9"
                        className="stroke-[color-mix(in_oklab,var(--color-fg)_24%,transparent)]"
                      />
                    ))}
                    {points.slice(1).map((_, i) => {
                      const walked = list[i + 1]!.status !== 'locked'
                      return (
                        <m.path
                          key={`walked-${i}`}
                          data-slot="progress-path-walked"
                          data-walked={walked || undefined}
                          d={segment(points, i)}
                          fill="none"
                          strokeWidth={4}
                          strokeLinecap="round"
                          stroke="var(--lp-tone)"
                          initial={k.reduced ? false : { pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: walked && shown ? 1 : 0, opacity: walked && shown ? 1 : 0 }}
                          transition={
                            k.reduced
                              ? { type: false }
                              : {
                                  pathLength: { ...k.tween('slow', 'emphasized'), delay: entered ? 0 : list[i]!.at * step },
                                  opacity: { type: false },
                                }
                          }
                        />
                      )
                    })}
                  </g>
                )
              })}
            </g>
          </svg>
        </div>

        {layout.map(({ section, tone, head, nodes: list, done }) => {
          const headId = `${hintId}-${section.id}`
          return (
            <section key={section.id} aria-labelledby={headId} data-slot="progress-path-section" style={{ '--lp-tone': tone } as CSSProperties}>
              <div
                data-slot="progress-path-head"
                className={cn('absolute inset-x-0 own:flex items-end gap-4 px-1 pb-4', head > 0 && 'border-t border-line')}
                style={{ top: head, height: HEAD, '--lp-tone': tone } as CSSProperties}
              >
                <div className="own:flex min-w-0 flex-1 flex-col gap-1">
                  {section.eyebrow && (
                    <span
                      data-slot="progress-path-eyebrow"
                      className="own:flex items-center gap-2 own:font-(family-name:--yj-label-font) own:text-ui-xs own:text-fg-muted own:tracking-(--yj-label-tracking) own:[text-transform:var(--yj-label-case)]"
                    >
                      <span aria-hidden className="size-1.5 rounded-full bg-(--lp-tone)" />
                      {section.eyebrow}
                    </span>
                  )}
                  <span id={headId} data-slot="progress-path-title" className="truncate own:text-ui-lg own:font-medium own:text-fg">
                    {section.title}
                  </span>
                </div>
                <div className="own:flex w-24 shrink-0 flex-col items-end gap-1.5">
                  <span data-slot="progress-path-value" className="own:font-mono own:text-ui own:text-fg own:tabular-nums">
                    {num.format(done)}
                    <span className="own:text-fg-muted">/{num.format(list.length)}</span>
                    <span className="sr-only">{`, ${labels.sectionProgress(done, list.length)}`}</span>
                  </span>
                  <ShareBar
                    value={done}
                    max={Math.max(1, list.length)}
                    segments={Math.max(1, list.length)}
                    className="h-1.5 min-w-0"
                    style={{ '--share-bar-fill': 'var(--lp-tone)' } as CSSProperties}
                  />
                </div>
              </div>

              <ol>
                {list.map((node) => {
                  const { lesson, status } = node
                  const mastery = Math.min(levels, Math.max(0, lesson.mastery ?? 0))
                  const mastered = mastery >= levels && status === 'done'
                  const side = node.side
                  const gap = 360 / levels
                  const trim = levels > 1 ? 14 : 0
                  const name = lesson.milestone
                    ? labels.milestoneItem(lesson.title, spoken(status))
                    : labels.lessonItem(lesson.title, node.at + 1, all.length, spoken(status), mastery, levels)
                  const Icon = lesson.milestone
                    ? TrophyIcon
                    : status === 'locked'
                      ? LockIcon
                      : status === 'current'
                        ? StarIcon
                        : mastered
                          ? CrownIcon
                          : CheckIcon
                  return (
                    <li key={lesson.id}>
                      <button
                        ref={(el: HTMLButtonElement | null) => void (el ? refs.current.set(lesson.id, el) : refs.current.delete(lesson.id))}
                        type="button"
                        data-slot="progress-path-node"
                        data-lesson-id={lesson.id}
                        data-state={status}
                        data-milestone={lesson.milestone || undefined}
                        aria-label={name}
                        aria-current={status === 'current' ? 'step' : undefined}
                        aria-disabled={status === 'locked' || undefined}
                        tabIndex={lesson.id === tabStop ? 0 : -1}
                        onFocus={() => setActive(lesson.id)}
                        onClick={(e) => {
                          if (status !== 'locked') return onSelect?.(lesson, section)
                          // A locked lesson shakes its head.
                          if (!k.reduced) animate(e.currentTarget, { x: [0, -4, 4, -2, 0] }, k.tween('base', 'standard'))
                          if (sound) cue('error')
                        }}
                        className={cn(
                          'group/node focus-ring absolute own:grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full rtl:translate-x-1/2',
                          status === 'locked' ? 'cursor-not-allowed' : 'cursor-pointer',
                        )}
                        style={{ top: node.y, insetInlineStart: `calc(50% + ${node.x}px)`, width: NODE, height: NODE }}
                      >
                        {status === 'current' && (
                          <span
                            aria-hidden
                            data-slot="progress-path-glow"
                            className="absolute inset-0 rounded-full shadow-[0_0_0_7px_color-mix(in_oklab,var(--lp-tone)_16%,transparent),0_0_28px_6px_color-mix(in_oklab,var(--lp-tone)_34%,transparent)]"
                          >
                            {!k.reduced && live && (
                              <m.span
                                className="absolute inset-0 rounded-full border-2 border-(--lp-tone)"
                                initial={{ scale: 1, opacity: 0.6 }}
                                animate={{ scale: 1.55, opacity: 0 }}
                                transition={{
                                  ...k.tween('deliberate', 'exit'),
                                  duration: k.duration('deliberate') * 3,
                                  repeat: Infinity,
                                  repeatDelay: k.duration('slow'),
                                }}
                              />
                            )}
                          </span>
                        )}
                        <svg
                          aria-hidden
                          data-slot="progress-path-ring"
                          viewBox="-30 -30 60 60"
                          className="absolute inset-0 size-full overflow-visible"
                        >
                          {Array.from({ length: levels }, (_, i) => {
                            const lit = status !== 'locked' && i < mastery
                            return (
                              <path
                                key={i}
                                data-slot="progress-path-level"
                                data-state={lit ? 'on' : 'off'}
                                d={levels === 1 ? arc(RING.r, 0.01, 359.99) : arc(RING.r, i * gap + trim / 2, (i + 1) * gap - trim / 2)}
                                fill="none"
                                strokeWidth={RING.width}
                                strokeLinecap="round"
                                className="transition-[stroke] yj-duration-slow ease-standard"
                                style={{
                                  stroke: lit
                                    ? 'var(--lp-tone)'
                                    : `color-mix(in oklab, var(--color-fg) ${status === 'locked' ? 9 : 16}%, transparent)`,
                                }}
                              />
                            )
                          })}
                        </svg>
                        <span
                          data-slot="progress-path-disc"
                          className={cn(
                            'relative own:grid size-[2.625rem] place-items-center transition-[background-color,color,box-shadow,scale] yj-duration-base ease-standard group-hover/node:scale-105 group-active/node:scale-95 reduced:transition-none',
                            lesson.milestone ? 'rounded-[min(0.875rem,calc(var(--yj-radius)*100))]' : 'rounded-full',
                            status === 'done' &&
                              'bg-[color-mix(in_oklab,var(--lp-tone)_22%,transparent)] own:text-(--lp-tone) shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--lp-tone)_30%,transparent)]',
                            status === 'current' &&
                              'bg-fg own:text-canvas shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-canvas)_18%,transparent)]',
                            status === 'locked' &&
                              'bg-[color-mix(in_oklab,var(--color-fg)_6%,transparent)] own:text-fg-subtle group-hover/node:scale-100',
                          )}
                        >
                          <Icon size={lesson.milestone ? 20 : 18} />
                        </span>
                      </button>
                      <span
                        aria-hidden
                        data-slot="progress-path-label"
                        data-side={side}
                        className={cn(
                          'pointer-events-none absolute own:hidden w-[calc(50%-var(--lp-reach))] min-w-0 -translate-y-1/2 flex-col gap-0.5 own:@lg/progress-path:flex',
                          side === 'start' ? 'own:text-start' : 'items-end own:text-end',
                        )}
                        style={
                          {
                            top: node.y,
                            '--lp-reach': `${Math.abs(node.x) + NODE / 2 + 14}px`,
                            ...(side === 'start'
                              ? { insetInlineStart: `calc(50% + var(--lp-reach))` }
                              : { insetInlineEnd: `calc(50% + var(--lp-reach))` }),
                          } as unknown as CSSProperties
                        }
                      >
                        <span className={cn('max-w-full truncate own:text-ui', status === 'locked' ? 'own:text-fg-muted' : 'own:text-fg')}>
                          {lesson.title}
                        </span>
                        {lesson.detail && (
                          <span className="max-w-full truncate own:font-mono own:text-ui-xs own:text-fg-muted own:tabular-nums">{lesson.detail}</span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ol>
            </section>
          )
        })}

        {current && (
          <div
            aria-hidden
            data-slot="progress-path-callout"
            data-side={callout}
            className="pointer-events-none absolute start-1/2 top-0 z-10 transition-[translate] yj-duration-slow ease-emphasized reduced:transition-none"
            style={
              {
                translate: `calc(${current.x + (callout === 'start' ? -1 : 1) * (NODE / 2 + 6)}px * var(--lp-dir)) ${current.y}px`,
                '--lp-tone': layout.find((l) => l.section === current.section)!.tone,
              } as CSSProperties
            }
          >
            {/* Remounted when it changes sides, so it fades in on the new side instead of sliding across the node. */}
            <m.span
              key={callout}
              className={cn('absolute top-0 flex -translate-y-1/2 items-center', callout === 'start' ? 'end-0 flex-row' : 'start-0 flex-row-reverse')}
              initial={k.reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1, y: !k.reduced && live ? [0, -2, 0] : 0 }}
              transition={
                k.reduced
                  ? { type: false }
                  : {
                      opacity: k.tween('base', 'enter'),
                      y: { ...k.tween('deliberate', 'standard'), duration: k.duration('deliberate') * 2.5, repeat: Infinity },
                    }
              }
            >
              <span className="rounded-[calc(var(--yj-radius)*100)] border border-line bg-overlay px-2.5 py-1.5 own:font-(family-name:--yj-label-font) own:text-ui-xs own:leading-none own:font-medium whitespace-nowrap own:text-fg own:tracking-(--yj-label-tracking) shadow-md own:[text-transform:var(--yj-label-case)]">
                {labels.lessonStart}
              </span>
              <span
                className={cn(
                  'size-2 rotate-45 border-line bg-overlay',
                  callout === 'start' ? 'own:-ms-[5px] border-e border-t' : 'own:-me-[5px] border-s border-b',
                )}
              />
            </m.span>
          </div>
        )}
      </div>
    </MotionFeatures>
  )
}

export { ProgressPath, type ProgressPathLesson, type ProgressPathProps, type ProgressPathSection, type ProgressPathTone }
