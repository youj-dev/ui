'use client'

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react'
import { AnimatePresence, m } from 'motion/react'
import { useYouj, useDirection } from '@youj/core/lib/youj/provider'
import { useComponentLabels } from '@youj/core/labels'
import { wizardLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'
import { Button } from './button'
import { AsyncButton } from './async-button'
import { Stepper, type StepperStep } from './stepper'
import { MotionFeatures } from '@youj/core'

/* A multi-step flow: a Stepper, one step's content at a time, and Back /
 * Next. Each step can validate before you leave it (sync or async; Next
 * shows a spinner while it runs), and a failed step is marked in the
 * Stepper, its message is announced, and you stay on it.
 * - Motion: the incoming step slides in from the side you are traveling to
 *   and the outgoing one leaves the other way (a 24px drift and a fade, on
 *   the base token), while the panel's height glides between the two on the
 *   smooth spring. Rapid Next/Back presses retarget without jumps. Reduced
 *   motion: steps swap in place.
 * - Access: the summary ("Step 2 of 4: Workspace") is a polite live region,
 *   and focus moves to the new step's heading after Back or Next, so a
 *   screen reader starts reading the new step. Finishing runs `onComplete`
 *   through Button's onAction (spinner, then a drawn check). */

type ValidationResult = boolean | string | void
interface WizardStepProps {
  id: string
  title: ReactNode
  description?: ReactNode
  /** Can be skipped: shows "Optional" and a Skip button. */
  optional?: boolean
  /**
   * Runs when leaving the step forwards. Return (or resolve) `false` to stay
   * on it (the step's own field errors explain why), or a message, which is
   * shown under the step and announced. Throwing counts as a failure with the
   * error's message.
   */
  validate?: () => ValidationResult | Promise<ValidationResult>
  children: ReactNode
}

/** One step of a Wizard. Renders nothing itself: the Wizard shows its children when it is current. */
function WizardStep(_props: WizardStepProps): null {
  return null
}

interface WizardProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  children: ReactNode
  /** Controlled current step index. */
  step?: number
  defaultStep?: number
  onStepChange?: (step: number) => void
  /** Runs when Finish is pressed on the last step (after its validation). Resolve for success. */
  onComplete?: () => unknown | Promise<unknown>
  orientation?: 'horizontal' | 'vertical'
  /** Labels. */
  backLabel?: string
  nextLabel?: string
  finishLabel?: string
  finishSuccessLabel?: string
  /** Extra content in the footer, at the inline start (e.g. a Cancel button). */
  footerStart?: ReactNode
  /** The step title's heading level: 3 under a section or dialog title (the default), 2 straight under a page's h1. */
  headingLevel?: 2 | 3 | 4
}

function Wizard({
  children,
  step: stepProp,
  defaultStep = 0,
  onStepChange,
  onComplete,
  orientation = 'horizontal',
  backLabel,
  nextLabel,
  finishLabel,
  finishSuccessLabel,
  footerStart,
  headingLevel = 3,
  className,
  ...props
}: WizardProps) {
  const Heading = `h${headingLevel}` as const
  const k = useYouj()
  const labels = useComponentLabels(wizardLabels)
  const steps = Children.toArray(children).filter(
    (child): child is ReactElement<WizardStepProps> => isValidElement(child) && child.type === WizardStep,
  )
  const [inner, setInner] = useState(defaultStep)
  const index = Math.min(stepProp ?? inner, Math.max(steps.length - 1, 0))
  const [direction, setDirection] = useState(1)
  const [errors, setErrors] = useState<Record<string, string | true>>({})
  const [validating, setValidating] = useState(false)
  const moved = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const run = useRef(0)
  const uid = useId()
  const root = useRef<HTMLDivElement>(null)
  const rtl = useDirection() === 'rtl'

  const current = steps[index]
  const last = index === steps.length - 1

  const go = useCallback(
    (next: number) => {
      if (next === index || next < 0 || next >= steps.length) return
      run.current++ // a pending validation of the step we left no longer counts
      setValidating(false)
      setDirection(next > index ? 1 : -1)
      moved.current = true
      if (stepProp === undefined) setInner(next)
      onStepChange?.(next)
    },
    [index, steps.length, stepProp, onStepChange],
  )

  /** Runs the current step's validation; true when it may be left. */
  const check = useCallback(async () => {
    if (!current) return false
    const { id, validate } = current.props
    if (!validate) return true
    const ticket = ++run.current
    setValidating(true)
    let result: ValidationResult
    try {
      result = await validate()
    } catch (error) {
      result = error instanceof Error ? error.message : false
    }
    if (ticket !== run.current) return false
    setValidating(false)
    const ok = result === undefined || result === true
    setErrors((prev) => {
      const next = { ...prev }
      if (ok) delete next[id]
      else next[id] = typeof result === 'string' ? result : true
      return next
    })
    return ok
  }, [current])

  const next = async () => {
    if (validating) return
    if (await check()) go(index + 1)
  }

  // After Back/Next, focus the new step's heading so reading starts there.
  useEffect(() => {
    if (moved.current) headingRef.current?.focus({ preventScroll: true })
  }, [index])

  const stepperSteps: StepperStep[] = steps.map((s) => ({
    id: s.props.id,
    title: s.props.title,
    optional: s.props.optional,
    invalid: Boolean(errors[s.props.id]),
  }))
  const error = current ? errors[current.props.id] : undefined
  const vertical = orientation === 'vertical'
  // The drift follows the reading direction: forwards is towards the inline end.
  const slide = k.reduced ? 0 : rtl ? -24 : 24

  return (
    <MotionFeatures>
      <div
        ref={root}
        data-slot="wizard"
        data-orientation={orientation}
        className={cn('own:flex gap-6', vertical ? 'flex-col sm:flex-row' : 'flex-col', className)}
        {...props}
      >
        <Stepper
          steps={stepperSteps}
          current={index}
          orientation={vertical ? 'vertical' : 'horizontal'}
          compact={!vertical}
          onStepClick={(target) => target < index && go(target)}
          className={vertical ? 'shrink-0 sm:w-52' : undefined}
        />
        <div className="own:flex min-w-0 flex-1 flex-col gap-5">
          <p aria-live="polite" data-slot="wizard-summary" className="own:-mb-3 own:text-ui-sm own:text-fg-muted own:tabular-nums">
            {labels.stepOf(index + 1, steps.length)}
            <span className="sr-only">: {typeof current?.props.title === 'string' ? current.props.title : ''}</span>
          </p>
          <AutoHeight>
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              {current && (
                <m.section
                  key={current.props.id}
                  data-slot="wizard-step"
                  aria-labelledby={`${uid}-${current.props.id}-title`}
                  custom={direction}
                  variants={{
                    enter: (dir: number) => ({ opacity: 0, x: dir * slide }),
                    center: { opacity: 1, x: 0 },
                    exit: (dir: number) => ({ opacity: 0, x: -dir * slide }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={k.reduced ? { type: false } : k.tween('base', 'standard')}
                  className="own:flex flex-col gap-4"
                >
                  <div className="own:flex flex-col gap-1">
                    <Heading
                      id={`${uid}-${current.props.id}-title`}
                      ref={headingRef}
                      tabIndex={-1}
                      className="own:text-ui-lg own:font-semibold own:tracking-tight own:text-fg outline-none"
                    >
                      {current.props.title}
                    </Heading>
                    {current.props.description && <p className="own:text-ui own:text-fg-muted">{current.props.description}</p>}
                  </div>
                  {current.props.children}
                  {typeof error === 'string' && (
                    <p role="alert" data-slot="wizard-error" className="own:text-ui-sm own:text-danger-text">
                      {error}
                    </p>
                  )}
                </m.section>
              )}
            </AnimatePresence>
          </AutoHeight>
          <div data-slot="wizard-footer" className="own:flex items-center gap-2 border-t border-line own:pt-4">
            {footerStart}
            <div className="ms-auto own:flex items-center gap-2">
              {index > 0 && (
                <Button variant="ghost" onClick={() => go(index - 1)}>
                  {backLabel ?? labels.back}
                </Button>
              )}
              {current?.props.optional && !last && (
                <Button variant="outline" onClick={() => go(index + 1)}>
                  {labels.skip}
                </Button>
              )}
              {last ? (
                <AsyncButton
                  key="finish"
                  onAction={async () => {
                    if (!(await check())) throw new Error('Invalid step')
                    await onComplete?.()
                  }}
                  pendingLabel={labels.finishing}
                  successLabel={finishSuccessLabel ?? labels.done}
                  errorLabel={labels.checkStep}
                >
                  {finishLabel ?? labels.finish}
                </AsyncButton>
              ) : (
                <Button key="next" loading={validating} loadingLabel={labels.checking} onClick={next}>
                  {nextLabel ?? labels.continue}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </MotionFeatures>
  )
}

/** Glides its height to its content's on the smooth spring; the popped-out exiting step doesn't count. */
function AutoHeight({ children }: { children: ReactNode }) {
  const k = useYouj()
  const inner = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>('auto')
  useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    const measure = () => setHeight(el.offsetHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return (
    <m.div
      className="relative -mx-1 overflow-hidden px-1"
      initial={false}
      animate={{ height }}
      transition={k.reduced ? { type: false } : k.spring('smooth')}
    >
      <div ref={inner} className="own:flow-root py-1">
        {children}
      </div>
    </m.div>
  )
}

export { Wizard, WizardStep, type WizardProps, type WizardStepProps }
