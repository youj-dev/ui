'use client'

import { useEffect, useId, useState, type HTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, ThemeScope, useYouj, type ThemeInput } from '@youj/core'
import { ChevronUpIcon } from '@youj/icons'
import { cn } from '../../lib/utils'
import { designTheme, PULSE, type Survey, type SurveyAnswers } from './question/data'
import { useSurveyFlow } from './question/flow'
import { DEFAULT_BRAND, DEFAULT_COPY } from './widget/copy'
import { WidgetPanel } from './widget/panel'

/* A survey in a corner of your product, the way in-app research asks: a
 * small card that rises from the inline-end corner without taking focus,
 * asks one question at a time (a pick goes on by itself), and thanks you in
 * place. It keeps one size from question to question; a long one scrolls
 * inside it. Minimize folds it into a pill that remembers where you were,
 * and the pill opens it back along the same shape. × dismisses it (Escape
 * does too, from inside), and the app hears it through `onOpenChange`. On a
 * phone it's a sheet along the bottom edge, in the thumb's reach. `embedded`
 * draws it in the flow of your page instead of over it (a preview, a
 * settings page). Reduced motion: it appears, folds and leaves in place.
 *
 * Pass your `survey` (keep it short: two or three questions), keep the
 * answers with `value`/`onValueChange`, and send them through `onSubmit`. */

type SurveyWidgetCopy = typeof DEFAULT_COPY

interface SurveyWidgetProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'defaultValue' | 'onSubmit'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** In the flow of the page (a preview, a settings page) instead of floating in its corner. Default false. */
  embedded?: boolean
  /** Take the whole width it's given, embedded, instead of its natural width (352px at 100% scale). Default false. */
  fill?: boolean
  /** Your page, behind the widget. Default: none, so the widget floats over whatever is on screen. */
  children?: ReactNode
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<SurveyWidgetCopy>
  /** Formats answers (BCP 47). Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The survey: a short one. Default: an NPS pulse whose follow-up depends on the score. */
  survey?: Survey
  value?: SurveyAnswers
  defaultValue?: SurveyAnswers
  onValueChange?: (answers: SurveyAnswers) => void
  /** Sends the answers; reject to keep them and say so. Default: a short demo wait. */
  onSubmit?: (answers: SurveyAnswers) => Promise<unknown> | unknown
  /** Whether it's showing, controlled: pair it with `onOpenChange`. */
  open?: boolean
  /** Showing at first, when the block owns it. Default true. */
  defaultOpen?: boolean
  /** Called when × or Escape dismisses it, or the thanks is closed. */
  onOpenChange?: (open: boolean) => void
  /** Starts folded into its pill. Default false. */
  defaultMinimized?: boolean
  /** Waits this many milliseconds after mounting before it rises in. Default 0. */
  delay?: number
  /** The corner it floats in. Default 'end'. */
  side?: 'start' | 'end'
  /** The product, at the top of the card. Default: Tern. */
  brand?: { name: string; logo?: ReactNode }
  seed?: string
}

function SurveyWidget({
  theme,
  embedded = false,
  fill = false,
  children,
  copy: copyProp,
  locale,
  survey = PULSE,
  value,
  defaultValue,
  onValueChange,
  onSubmit,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  defaultMinimized = false,
  delay = 0,
  side = 'end',
  brand = DEFAULT_BRAND,
  seed,
  className,
  ...rest
}: SurveyWidgetProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const k = useYouj()
  const layoutId = useId()
  const flow = useSurveyFlow({
    survey,
    value,
    defaultValue,
    onValueChange,
    onSubmit,
    action: 'SurveyWidget: onSubmit',
    review: false,
    copy,
    locale,
    seed,
  })
  const [ownOpen, setOwnOpen] = useState(defaultOpen)
  const open = openProp ?? ownOpen
  const [minimized, setMinimized] = useState(defaultMinimized)
  // It rises in a beat after the page settles (`delay`), never all at once with it.
  const [ready, setReady] = useState(delay <= 0)
  useEffect(() => {
    if (delay <= 0) return
    const timer = setTimeout(() => setReady(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOwnOpen(next)
    onOpenChange?.(next)
  }

  const showing = open && ready
  const corner = side === 'end' ? 'justify-end sm:end-4' : 'justify-start sm:start-4'
  const travel = k.reduced ? 0 : 24
  const panel = (
    <WidgetPanel
      flow={flow}
      survey={survey}
      brand={brand}
      copy={copy}
      layoutId={embedded ? undefined : layoutId}
      onMinimize={embedded ? undefined : () => setMinimized(true)}
      onClose={() => setOpen(false)}
      {...rest}
      className={cn(embedded ? cn('shadow-sm', !fill && 'max-w-88') : 'shadow-lg sm:w-88', className)}
    />
  )

  let widget: ReactNode
  if (embedded) widget = open ? panel : null
  else
    widget = (
      <div className={cn('pointer-events-none fixed inset-x-0 bottom-0 z-50 flex sm:inset-x-auto sm:bottom-4', corner)}>
        <AnimatePresence initial>
          {showing && !minimized && (
            <m.div
              key="panel"
              className="pointer-events-auto w-full sm:w-auto"
              initial={{ opacity: 0, y: travel, scale: k.reduced ? 1 : 0.98 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { y: k.spring('smooth'), scale: k.spring('smooth'), opacity: k.tween('fast', 'enter') },
              }}
              exit={{ opacity: 0, y: travel / 2, transition: k.tween('fast', 'exit') }}
            >
              {panel}
            </m.div>
          )}
          {showing && minimized && (
            <m.button
              key="pill"
              type="button"
              layoutId={layoutId}
              aria-label={copy.expand(Math.max(1, flow.index), flow.total + flow.pending)}
              onClick={() => setMinimized(false)}
              className="pointer-events-auto m-4 flex h-control-lg items-center gap-2.5 rounded-full border border-line bg-overlay ps-2 pe-3.5 text-ui font-medium text-fg shadow-lg focus-ring sm:m-0"
              data-yj-tone="overlay"
              initial={{ opacity: 0, y: travel / 2 }}
              animate={{ opacity: 1, y: 0, transition: { opacity: k.tween('fast', 'enter'), y: k.spring('smooth') } }}
              exit={{ opacity: 0, transition: k.tween('instant', 'exit') }}
              transition={k.spring('smooth')}
            >
              <span aria-hidden className="grid size-7 place-items-center rounded-full bg-accent text-ui-xs font-bold text-on-accent">
                {brand.name.charAt(0)}
              </span>
              <span>{survey.title}</span>
              <span aria-hidden className="font-mono text-ui-sm text-fg-muted tabular-nums">
                {copy.position(Math.max(1, flow.index), flow.total + flow.pending)}
              </span>
              <ChevronUpIcon size={14} aria-hidden className="text-fg-muted" />
            </m.button>
          )}
        </AnimatePresence>
      </div>
    )

  const designed = survey.design ? <ThemeScope theme={designTheme(survey.design)}>{widget}</ThemeScope> : widget
  const content = (
    <MotionFeatures features="max">
      {embedded ? null : children}
      {designed}
    </MotionFeatures>
  )
  return theme ? <ThemeScope theme={theme}>{content}</ThemeScope> : content
}

export { SurveyWidget, DEFAULT_COPY as SURVEY_WIDGET_COPY }
export type { Survey, SurveyAnswers, SurveyWidgetCopy, SurveyWidgetProps }
