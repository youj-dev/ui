'use client'

import { useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, useYouj, type ThemeInput } from '@youj/core'
import { ArrowRightIcon, MoreHorizontalIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { ProgressPath } from '../../components/ui/progress-path'
import { useAnnouncer } from '../../hooks/use-announcer'
import { cn, numberFormat } from '../../lib/utils'
import { CURRENT, DEFAULT_COPY, GOAL, LEVEL, POINTS, SECTIONS, STEP_POINTS, STREAK, WEEK, todayOf, type StepPathCopy, type StepPathLevel, type StepPathSection, type StepPathStep } from './step-path/data'
import { ProgressCard } from './step-path/progress-card'
import { PathPlaceholder } from './step-path/states'

/* A course, a program or an onboarding as a trail: the ProgressPath of steps
 * in sections, each step ringed by its mastery, the current one glowing with
 * Start over it, and beside it the learner's progress: total points toward the
 * next level, the week's streak as seven flames, and today's goal. Continue
 * finishes the step up next: its ring gains a level, the trail draws on to the
 * next node, the points count up, and today's flame lights. Opening a step
 * calls `onOpenStep`. The demo is a language course; pass your own sections,
 * level, goal and the words in `copy`. Loading, an error with Retry and no
 * sections take the trail's place at its size.
 * Reduced motion: every change is drawn in place.
 * It is built for the compact layout density (ui.css), taken from the page; embedded,
 * it stops at its natural width, as it does on its own, unless `fill`. */

interface StepPathProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Inside another app: a `section` named by an `h2`, without the page around the cards. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (1088px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<StepPathCopy>
  /** How its dates, times and numbers read (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The trail: sections of steps in order. */
  sections?: StepPathSection[]
  /** The step up next. Default: the demo's. */
  current?: string
  /** Points so far. Default 1,240. */
  points?: number
  /** Points a finished step earns. Default 20. */
  stepPoints?: number
  /** The level the points are working toward: its number and the points at its start and end. Default: level 7, 1,000 to 1,500. */
  level?: StepPathLevel
  /** Points a day aims for. Default 50. */
  goal?: number
  /** Intl.NumberFormat options for every figure of points. Default: plain numbers in the locale. */
  format?: Intl.NumberFormatOptions
  /** Points earned each day this week, Monday first; `null` for days still to come. Today is the last day with a figure. Default: the demo's week, with nothing done today. */
  week?: (number | null)[]
  /** Days in a row up to yesterday; today adds one once a step is done. Default 12. */
  streak?: number
  /** Called when a step is opened from the trail. */
  onOpenStep?: (step: StepPathStep) => void
  /** Skeletons in place of the trail and the figures while your course loads. Default false. */
  loading?: boolean
  /** Shown in place of the trail when it fails to load, with Retry when `onRetry` is set. */
  error?: string
  /** Retries after an `error`. */
  onRetry?: () => void
  /** Replaces the message when there are no sections. Default: `copy.emptyTitle` and `copy.emptyDescription`. */
  empty?: ReactNode
}

interface FrameProps {
  copy: StepPathCopy
  Title: 'h1' | 'h2'
  titleId: string
  /** The foot: the step count and the buttons. */
  footer: ReactNode
  children: ReactNode
  /** After the foot: what is not drawn, like the live region. */
  tail?: ReactNode
}

/** The trail's card: its head and foot, the same whether the course is there or not. */
function Frame({ copy, Title, titleId, footer, children, tail }: FrameProps) {
  return (
    <Card className="flex w-full min-w-0 flex-col">
      <CardHeader>
        <CardTitle>
          <Title id={titleId}>{copy.title}</Title>
        </CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="icon-sm" aria-label={copy.more}>
            <MoreHorizontalIcon size={16} />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
      <CardFooter className="flex-wrap">{footer}</CardFooter>
      {tail}
    </Card>
  )
}

function StepPath({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  sections = SECTIONS,
  current = CURRENT,
  points = POINTS,
  stepPoints = STEP_POINTS,
  level = LEVEL,
  goal = GOAL,
  format,
  week = WEEK,
  streak = STREAK,
  onOpenStep,
  loading = false,
  error,
  onRetry,
  empty,
  className,
  ...rest
}: StepPathProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  // Its natural width: on the layout on its own page, on the section embedded (where a className can change it).
  const cap = !fill && 'max-w-272'
  const state = loading ? 'loading' : error ? 'error' : sections.every((s) => s.lessons.length === 0) ? 'empty' : null
  const heading = embedded ? 'h3' : 'h2'

  // Its progress is its own state from the first paint: a course that was loading mounts again when its sections arrive.
  const layout = (
    <div className={cn('grid w-full items-start gap-5 lg:grid-cols-[minmax(0,1fr)_--spacing(84)]', !embedded && cap)}>
      {state ? (
        <>
          <Frame
            copy={copy}
            Title={Title}
            titleId={titleId}
            footer={
              <>
                <span className="me-auto text-fg-subtle">—</span>
                <Button variant="secondary" disabled>
                  {copy.practice}
                </Button>
                <Button disabled>
                  {copy.continue}
                  <ArrowRightIcon size={14} className="rtl:-scale-x-100" />
                </Button>
              </>
            }
          >
            <PathPlaceholder state={state} copy={copy} error={error} onRetry={onRetry} empty={empty} />
          </Frame>
          <ProgressCard points={points} week={week} streak={streak} level={level} goal={goal} format={format} copy={copy} heading={heading} state={state} />
        </>
      ) : (
        <StepPathBody
          copy={copy}
          Title={Title}
          titleId={titleId}
          heading={heading}
          sections={sections}
          current={current}
          points={points}
          stepPoints={stepPoints}
          level={level}
          goal={goal}
          format={format}
          week={week}
          streak={streak}
          onOpenStep={onOpenStep}
        />
      )}
    </div>
  )

  const view = embedded ? (
    <section aria-labelledby={titleId} {...rest} className={cn('w-full', cap, className)}>
      {layout}
    </section>
  ) : (
    <main
      aria-labelledby={titleId}
      {...rest}
      className={cn('grid min-h-dvh w-full grid-cols-[minmax(0,1fr)] place-items-center bg-canvas px-4 py-10 text-fg', className)}
    >
      {layout}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{view}</ThemeScope> : view
}

interface BodyProps extends Omit<FrameProps, 'footer' | 'children' | 'tail'> {
  heading: 'h2' | 'h3'
  sections: StepPathSection[]
  current: string
  points: number
  stepPoints: number
  level: StepPathLevel
  goal: number
  format?: Intl.NumberFormatOptions
  week: (number | null)[]
  streak: number
  onOpenStep?: (step: StepPathStep) => void
}

function StepPathBody({ copy, Title, titleId, heading, sections: initial, current: initialCurrent, points: initialPoints, stepPoints, level, goal, format, week: initialWeek, streak: streakSoFar, onOpenStep }: BodyProps) {
  const k = useYouj()
  const { announce, announcer } = useAnnouncer()
  const scroller = useRef<HTMLDivElement>(null)
  const [sections, setSections] = useState(initial)
  const [current, setCurrent] = useState<string | null>(initialCurrent)
  const [points, setPoints] = useState(initialPoints)
  const [week, setWeek] = useState(initialWeek)

  const steps = sections.flatMap((s) => s.lessons)
  const index = current === null ? -1 : steps.findIndex((l) => l.id === current)
  const step = steps[index]
  // Today is the last day of the week with a figure.
  const today = todayOf(week)
  const streak = streakSoFar + ((week[today] ?? 0) > 0 ? 1 : 0)

  // The path scrolls within its card: keep the step up next in view, centered on the first paint.
  const first = useRef(true)
  useLayoutEffect(() => {
    const box = scroller.current
    const node = box?.querySelector<HTMLElement>('[data-slot=progress-path-node][data-state=current]')
    if (!box || !node) return
    const offset = node.getBoundingClientRect().top - box.getBoundingClientRect().top + node.offsetHeight / 2
    const inView = offset > 64 && offset < box.clientHeight - 64
    if (first.current || !inView) box.scrollTo({ top: box.scrollTop + offset - box.clientHeight / 2, behavior: first.current || k.reduced ? 'auto' : 'smooth' })
    first.current = false
  }, [current, k.reduced])

  const advance = () => {
    if (!step) return
    const next = steps[index + 1]
    setSections((list) => list.map((s) => ({ ...s, lessons: s.lessons.map((l) => (l.id === step.id ? { ...l, mastery: Math.min(4, (l.mastery ?? 0) + 1) } : l)) })))
    setCurrent(next?.id ?? null)
    setPoints((n) => n + stepPoints)
    setWeek((w) => w.map((d, i) => (i === today ? (d ?? 0) + stepPoints : d)))
    announce(copy.completed(step.title, `${numberFormat(copy.locale, format).format(stepPoints)} ${copy.points}`, next?.title))
  }

  return (
    <>
      <Frame
        copy={copy}
        Title={Title}
        titleId={titleId}
        tail={announcer}
        footer={
          <>
            <span className="me-auto">{copy.steps(steps.length)}</span>
            <Button variant="secondary">{copy.practice}</Button>
            <Button onClick={advance} disabled={!step}>
              {step ? copy.continue : copy.finished}
              {step && <ArrowRightIcon size={14} className="rtl:-scale-x-100" />}
            </Button>
          </>
        }
      >
        <div
          ref={scroller}
          className="yj-scrollbar relative h-136 overflow-y-auto px-5 [mask-image:linear-gradient(to_bottom,transparent,black_2.5rem,black_calc(100%-2.5rem),transparent)] sm:px-6"
        >
          <ProgressPath sections={sections} current={current} label={copy.path} locale={copy.locale} onSelect={(l) => onOpenStep?.(l)} className="my-6" />
        </div>
      </Frame>
      <ProgressCard points={points} week={week} streak={streak} level={level} goal={goal} format={format} copy={copy} heading={heading} />
    </>
  )
}

export { StepPath, type StepPathProps }
export type { StepPathCopy, StepPathLevel, StepPathSection, StepPathStep }
