'use client'

import { PresenceItem, PresenceList } from '@youj/motion'
import { Badge } from '../../../components/ui/badge'
import { Field, FieldContent, FieldDescription, FieldLabel } from '../../../components/ui/field'
import { Switch } from '../../../components/ui/switch'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn } from '../../../lib/utils'
import type { PaceBudgetCopy, PaceBudgetStep } from './data'

interface StepsPlanProps {
  steps: PaceBudgetStep[]
  on: ReadonlySet<string>
  copy: PaceBudgetCopy
  format: (amount: number) => string
  onToggle: (id: string) => void
  /** Without data: skeleton rows while loading, or hidden rows that keep the plan's size behind a message. */
  placeholder?: 'loading' | 'blank'
}

/** Rows held by the skeleton and by the blank. */
const PLACEHOLDER_ROWS = 3

/** The plan's steps as switches, each with what it changes, what it costs you and what it saves; steps that ran leave the list. */
function StepsPlan({ steps, on, copy, format, onToggle, placeholder }: StepsPlanProps) {
  if (placeholder)
    return (
      <ul aria-hidden className={cn('flex flex-col divide-y divide-line', placeholder === 'blank' && 'invisible')}>
        {Array.from({ length: PLACEHOLDER_ROWS }, (_, i) => (
          <li key={i} className="flex items-center gap-4 py-3.5">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-48 max-w-full" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </div>
            <Skeleton className="h-6 w-14 shrink-0 rounded-full" />
            <Skeleton className="h-5 w-9 shrink-0 rounded-full" />
          </li>
        ))}
      </ul>
    )
  if (!steps.length) return <p className="py-3 text-ui text-fg-muted">{copy.nothingLeft}</p>
  return (
    <PresenceList className="flex flex-col divide-y divide-line">
      {steps.map((step) => {
        const active = on.has(step.id)
        return (
          <PresenceItem key={step.id}>
            <Field orientation="horizontal" className="gap-4 py-3.5">
              <FieldContent className="min-w-0">
                <FieldLabel className={cn('font-normal transition-colors yj-duration-fast ease-standard', active ? 'text-fg' : 'text-fg-muted')}>
                  {step.title}
                </FieldLabel>
                <FieldDescription>{step.detail}</FieldDescription>
              </FieldContent>
              {/* The amount says what the step is worth; the switch beside it is the choice. */}
              <Badge
                dir="auto"
                variant={active ? 'default' : 'secondary'}
                size="lg"
                className="shrink-0 font-mono text-ui tracking-normal normal-case tabular-nums transition-colors yj-duration-fast ease-standard"
              >
                −{format(step.frees)}
              </Badge>
              <Switch checked={active} onCheckedChange={() => onToggle(step.id)} />
            </Field>
          </PresenceItem>
        )
      })}
    </PresenceList>
  )
}

export { StepsPlan }
