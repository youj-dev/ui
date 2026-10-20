'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { AlertTriangleIcon, CheckIcon, FlagIcon, RouteIcon } from '@youj/icons'
import { useYouj } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { stepperLabels } from '@youj/core/labels'
import type { YoujLabels } from '@youj/core'
import { cn } from '../../lib/utils'
import { MotionFeatures } from '@youj/core'

/* Where you are in a sequence. Each step is complete, current, upcoming or in
 * error, and can be marked optional. The current step's disc is the solid
 * one, in the accent; done steps step back to a tint with their check, and
 * upcoming ones are outlined.
 * - Motion: the connector after a step fills in the direction of travel (from
 *   the inline start, or downwards) on the slow token when that step is done,
 *   and drains back if you return; a reversal mid-fill continues from where
 *   it is. A step's disc changes on the base token as the fill arrives, and a
 *   finished step draws its check. Reduced motion: fills and marks are
 *   instant.
 * - Access: an ordered list; the current step is `aria-current="step"`, and
 *   every step's state is spoken with its title. With `onStepClick`, steps
 *   you may revisit (done ones, and the current one) are buttons.
 * - Detour (horizontal): a dotted arc in the accent leaves one step and lands
 *   on a later one, over the steps it bypasses, with its label riding the
 *   top. It draws from where it leaves on the deliberate token and its label
 *   rises in as the line arrives; it's measured from the discs, so it follows
 *   resizes and RTL. Read after the step it leaves from ("Detour, rejoins at
 *   step 4"). Reduced motion: drawn in place. */

type StepStatus = 'complete' | 'current' | 'upcoming' | 'error'

interface StepperStep {
  /** A stable key. */
  id: string
  /** The step's name. */
  title: ReactNode
  /** A second line under the title. */
  description?: ReactNode
  /** Adds "Optional" under the title. */
  optional?: boolean
  /** Marks the step as failed (e.g. its validation did not pass). */
  invalid?: boolean
  /**
   * Calls a step out without failing it (a deadline, a milestone to watch): until it's done its disc
   * wears a flag and its description the danger ink. The flag is decorative, so say why in the description.
   */
  flagged?: boolean
}

interface StepperDetour {
  /** Index of the step it leaves from. */
  from: number
  /** Index of the later step it rejoins. */
  to: number
  /** Rides the top of the arc: "Via the ring road". */
  label: ReactNode
  /** Beside the label, in the accent: "−31 min". */
  detail?: ReactNode
}

interface StepperProps extends Omit<ComponentProps<'ol'>, 'children'> {
  steps: readonly StepperStep[]
  /** Index of the current step. Steps before it are complete; `steps.length` means all are done. */
  current: number
  orientation?: 'horizontal' | 'vertical'
  /** Makes done steps (and the current one) buttons that go back to them. */
  onStepClick?: (index: number) => void
  /**
   * Makes done steps (and the current one) links to their pages instead, for
   * flows that span pages. `onStepClick` still fires on click.
   */
  stepHref?: (index: number) => string | undefined
  /** Hides titles and descriptions below the `sm` breakpoint (horizontal only), leaving the discs and connectors. */
  compact?: boolean
  /** A rerouted stretch, drawn as an arc from one step over the ones it bypasses to the step it rejoins. Horizontal only. */
  detour?: StepperDetour
}

const statusText = {
  complete: 'stepCompleted',
  current: 'stepCurrent',
  upcoming: 'stepUpcoming',
  error: 'stepError',
} as const satisfies Record<StepStatus, keyof YoujLabels>

function statusOf(step: StepperStep, index: number, current: number): StepStatus {
  if (step.invalid) return 'error'
  if (index < current) return 'complete'
  if (index === current) return 'current'
  return 'upcoming'
}

function Stepper({ steps, current, orientation = 'horizontal', onStepClick, stepHref, compact = false, detour: detourProp, className, ...props }: StepperProps) {
  const k = useYouj()
  const labels = useComponentLabels(stepperLabels)
  const vertical = orientation === 'vertical'
  const detour = !vertical && detourProp && detourProp.from >= 0 && detourProp.to > detourProp.from && detourProp.to < steps.length ? detourProp : undefined
  return (
    <MotionFeatures>
      <ol
        data-detour={detour ? '' : undefined}
        data-slot="stepper"
        data-orientation={orientation}
        data-reduced-motion={k.reduced || undefined}
        aria-label={props['aria-label'] ?? labels.progress}
        // Horizontal, it's the container its labels measure: under 32rem only the current one shows.
        className={cn('own:flex', vertical ? 'flex-col' : '@container items-start', detour && 'own:pt-12', className)}
        {...props}
      >
        {steps.map((step, index) => {
          const status = statusOf(step, index, current)
          const last = index === steps.length - 1
          const reachable = index < current || index === current
          const href = reachable ? stepHref?.(index) : undefined
          const interactive = onStepClick && reachable
          // In a narrow container (a phone, a sidebar, a card) a horizontal stepper can't fit
          // every label: only the current step keeps its text (compact hides them all), and
          // under 20rem not even that; the rest stay for screen readers.
          const narrowHidden = !vertical && (compact || index !== current)
          const tinyHidden = !vertical && !narrowHidden
          const flagged = !!step.flagged && (status === 'upcoming' || status === 'current')
          const label = (
            <>
              <StepIndicator status={status} number={index + 1} flagged={flagged} />
              <span className={cn('own:flex min-w-0 flex-col text-start', narrowHidden && 'own:@max-lg:sr-only', tinyHidden && 'own:@max-xs:sr-only', vertical ? 'pt-0.5' : '')}>
                <span
                  data-slot="stepper-title"
                  className={cn(
                    'own:text-ui own:font-medium transition-colors yj-duration-base ease-standard',
                    status === 'upcoming' ? 'own:text-fg-muted' : status === 'error' ? 'own:text-danger-text' : 'own:text-fg',
                  )}
                >
                  {step.title}
                </span>
                {(step.description || step.optional) && (
                  <span className={cn('own:text-ui-sm', flagged ? 'own:text-danger-text' : 'own:text-fg-muted')}>
                    {step.description}
                    {step.description && step.optional && ' · '}
                    {step.optional && labels.optional}
                  </span>
                )}
                <span className="sr-only">, {labels[statusText[status]]}</span>
              </span>
            </>
          )
          const stepClass = cn(
            'group/step -m-1 flex min-w-0 items-start gap-2.5 rounded-lg p-1 focus-ring',
            '[&:hover_[data-slot=stepper-title]]:underline [&:hover_[data-slot=stepper-title]]:underline-offset-4',
          )
          const content = href !== undefined ? (
            <a href={href} onClick={() => onStepClick?.(index)} className={stepClass}>
              {label}
            </a>
          ) : interactive ? (
            <button type="button" onClick={() => onStepClick(index)} className={stepClass}>
              {label}
            </button>
          ) : (
            <div className="own:flex min-w-0 items-start gap-2.5">{label}</div>
          )

          return (
            <li
              key={step.id}
              data-slot="stepper-item"
              data-status={status}
              data-bypassed={detour && index > detour.from && index < detour.to ? '' : undefined}
              aria-current={status === 'current' || (step.invalid && index === current) ? 'step' : undefined}
              className={cn(
                'relative flex min-w-0',
                vertical
                  ? 'flex-col'
                  : cn('items-start gap-3', !last && 'flex-1', !compact && (index === current ? '@max-lg:flex-1' : '@max-lg:flex-none')),
              )}
            >
              {content}
              {!last && (
                <StepConnector
                  filled={index < current}
                  vertical={vertical}
                  // Horizontal: fills the gap to the next step, level with the disc's center.
                  className={vertical ? 'own:my-1 own:ms-3 min-h-6 w-px flex-1 -translate-x-1/2 rtl:translate-x-1/2' : 'own:mt-3 own:me-3 min-w-6 flex-1'}
                />
              )}
              {detour?.from === index && (
                <span className="sr-only">
                  , {labels.stepDetour(detour.to + 1)}
                </span>
              )}
              <AnimatePresence>
                {detour?.from === index && <StepDetour key="detour" detour={detour} />}
              </AnimatePresence>
            </li>
          )
        })}
      </ol>
    </MotionFeatures>
  )
}

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect
/** How far the arc rises over the discs, in px. */
const RISE = 30

/** The detour's arc and label, placed in the step it leaves from but measured against the discs of both ends. */
function StepDetour({ detour }: { detour: StepperDetour }) {
  const k = useYouj()
  const ref = useRef<HTMLSpanElement>(null)
  const maskId = useId()
  const [box, setBox] = useState<{ left: number; top: number; width: number; reverse: boolean }>()

  useIsomorphicLayoutEffect(() => {
    // The list, from inside: its ref isn't attached yet when a child's layout effect first runs.
    const host = ref.current?.parentElement
    const list = host?.closest('ol')
    if (!list || !host) return
    const measure = () => {
      const discs = list.querySelectorAll<HTMLElement>(':scope > li [data-slot=stepper-indicator]')
      const a = discs[detour.from]?.getBoundingClientRect()
      const b = discs[detour.to]?.getBoundingClientRect()
      if (!a || !b) return
      const origin = host.getBoundingClientRect()
      const ax = a.left + a.width / 2
      const bx = b.left + b.width / 2
      setBox({ left: Math.min(ax, bx) - origin.left, top: a.top - origin.top - 2, width: Math.abs(bx - ax), reverse: bx < ax })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => observer.disconnect()
  }, [detour.from, detour.to])

  const w = box?.width ?? 0
  // A half-ellipse over the bypassed steps, drawn from the step it leaves.
  const d = box ? (box.reverse ? `M ${w} ${RISE} A ${w / 2} ${RISE} 0 0 0 0 ${RISE}` : `M 0 ${RISE} A ${w / 2} ${RISE} 0 0 1 ${w} ${RISE}`) : ''
  const draw = k.reduced ? { type: false as const } : k.tween('deliberate', 'emphasized')
  return (
    <m.span
      ref={ref}
      data-slot="stepper-detour"
      className="pointer-events-none absolute z-10"
      style={box ? { left: box.left, top: box.top - RISE, width: w, height: RISE } : { visibility: 'hidden' }}
      initial={false}
      exit={{ opacity: 0, transition: k.reduced ? { type: false } : k.tween('fast', 'exit') }}
    >
      {box && (
        <svg aria-hidden className="absolute inset-0 size-full overflow-visible" viewBox={`0 0 ${w} ${RISE}`}>
          <mask id={maskId} maskUnits="userSpaceOnUse" x={-4} y={-4} width={w + 8} height={RISE + 8}>
            <m.path d={d} fill="none" stroke="white" strokeWidth={6} initial={k.reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={draw} />
          </mask>
          <path data-slot="stepper-detour-arc" d={d} fill="none" strokeWidth={2} strokeLinecap="round" strokeDasharray="0.01 5" className="stroke-accent" mask={`url(#${maskId})`} />
        </svg>
      )}
      {box && (
        <m.span
          data-slot="stepper-detour-label"
          className="absolute top-0 left-1/2 own:flex h-6 -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 own:rounded-full border border-line own:bg-overlay own:ps-1.5 own:pe-2.5 own:text-ui-sm whitespace-nowrap own:text-fg own:shadow-sm-soft"
          initial={k.reduced ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={k.reduced ? { type: false } : { ...k.tween('base', 'enter'), delay: k.duration('deliberate') * 0.55 }}
        >
          <span aria-hidden className="own:grid size-4 place-items-center rounded-full bg-accent own:text-on-accent">
            <RouteIcon size={10} strokeWidth={2.5} />
          </span>
          <bdi>{detour.label}</bdi>
          {detour.detail && <bdi className="own:font-mono own:text-ui-xs own:text-accent-text own:tabular-nums">{detour.detail}</bdi>}
        </m.span>
      )}
    </m.span>
  )
}

function StepIndicator({ status, number, flagged }: { status: StepStatus; number: number; flagged: boolean }) {
  return (
    <span
      aria-hidden
      data-slot="stepper-indicator"
      data-status={status}
      data-yj-flagged={flagged || undefined}
      className={cn(
        'relative own:grid size-6 shrink-0 place-items-center rounded-mark border own:text-ui-sm own:font-medium own:tabular-nums',
        'transition-[background-color,border-color,color,box-shadow] yj-duration-base ease-standard',
        // The current step is the solid one, so the eye lands where you are; done steps step back to a tint with their check.
        'data-[status=upcoming]:border-line data-[status=upcoming]:bg-surface data-[status=upcoming]:text-fg-muted',
        'data-[status=current]:border-accent data-[status=current]:bg-accent data-[status=current]:text-on-accent data-[status=current]:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-accent)_18%,transparent)]',
        'data-[status=complete]:border-accent-line data-[status=complete]:bg-[color-mix(in_oklab,var(--color-accent)_12%,var(--color-surface))] data-[status=complete]:text-accent-text',
        'data-[status=error]:border-danger data-[status=error]:bg-surface data-[status=error]:text-danger-text',
        'data-[status=upcoming]:data-yj-flagged:border-danger-line data-[status=upcoming]:data-yj-flagged:bg-danger-subtle data-[status=upcoming]:data-yj-flagged:text-danger-text',
      )}
    >
      {status === 'complete' ? (
        <CheckIcon trigger="mount" size={14} strokeWidth={2.5} />
      ) : status === 'error' ? (
        <AlertTriangleIcon trigger="mount" size={12} strokeWidth={2.25} />
      ) : flagged ? (
        <FlagIcon size={12} strokeWidth={2.25} />
      ) : (
        number
      )}
    </span>
  )
}

function StepConnector({ filled, vertical, className }: { filled: boolean; vertical: boolean; className?: string }) {
  const k = useYouj()
  return (
    <span
      aria-hidden
      data-slot="stepper-connector"
      data-filled={filled || undefined}
      className={cn('relative overflow-hidden own:rounded-full bg-line', vertical ? '' : 'h-px', className)}
    >
      <m.span
        className={cn('absolute inset-0 bg-accent', vertical ? 'origin-top' : 'origin-left rtl:origin-right')}
        initial={false}
        animate={vertical ? { scaleY: filled ? 1 : 0 } : { scaleX: filled ? 1 : 0 }}
        transition={k.reduced ? { type: false } : k.tween('slow', 'standard')}
      />
    </span>
  )
}

export { Stepper, type StepperDetour, type StepperProps, type StepperStep, type StepStatus }
