'use client'

import type { ComponentProps } from 'react'
import { useComponentLabels } from '@youj/core/labels'
import { stepperNavLabels } from '@youj/core/labels'
import { cn } from '../../lib/utils'
import { Stepper, type StepperStep } from './stepper'

/* Step navigation for flows that span pages (checkout, onboarding, setup):
 * Stepper in a named nav landmark, with the steps you've done and the current
 * one as links back to their pages. Navigation only: it shows where you are
 * and links; the flow's logic stays with the app, and upcoming steps can't be
 * jumped to. Motion is Stepper's: the connector fills as a step completes and
 * drains if you go back, a finished step draws its check. Horizontal on
 * phones keeps the discs and connectors and drops the titles (`compact`).
 * Reduced motion: fills and checks are instant. */

interface StepperNavProps extends Omit<ComponentProps<'nav'>, 'children'> {
  steps: readonly StepperStep[]
  /** Index of the current step. */
  current: number
  /** The page of step `index`. Done steps and the current one link to it. */
  href: (index: number) => string
  /** Fires as a step link is followed, e.g. for client-side routing. */
  onNavigate?: (index: number) => void
  orientation?: 'horizontal' | 'vertical'
  /** Hide titles below `sm` (horizontal only). Default true. */
  compact?: boolean
}

function StepperNav({
  steps,
  current,
  href,
  onNavigate,
  orientation = 'horizontal',
  compact = true,
  className,
  'aria-label': label,
  ...props
}: StepperNavProps) {
  const labels = useComponentLabels(stepperNavLabels)
  return (
    <nav data-slot="stepper-nav" aria-label={label ?? labels.progress} className={cn('w-full', className)} {...props}>
      <Stepper
        steps={steps}
        current={current}
        orientation={orientation}
        compact={compact}
        stepHref={href}
        onStepClick={onNavigate}
        aria-label={labels.steps}
      />
    </nav>
  )
}

export { StepperNav }
export type { StepperNavProps }
