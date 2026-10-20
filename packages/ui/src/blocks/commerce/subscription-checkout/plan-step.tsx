'use client'

import { useId } from 'react'
import { Counter } from '@youj/motion'
import { CheckIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldTitle } from '../../../components/ui/field'
import { NumberInput } from '../../../components/ui/number-input'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { YEARLY_DISCOUNT, type Period, type Plan, type SubscriptionCheckoutCopy } from './data'

export function PlanStep({
  plans,
  plan,
  period,
  seats,
  copy,
  onPlan,
  onPeriod,
  onSeats,
}: {
  plans: Plan[]
  plan: string
  period: Period
  seats: number
  copy: SubscriptionCheckoutCopy
  onPlan: (id: string) => void
  onPeriod: (period: Period) => void
  onSeats: (seats: number) => void
}) {
  const factor = period === 'yearly' ? 1 - YEARLY_DISCOUNT : 1
  const billingId = useId()
  return (
    <FieldGroup className="gap-6">
      <div className="flex flex-col gap-2">
        <span id={billingId} className="text-ui font-medium text-fg">
          {copy.billing}
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl aria-labelledby={billingId} value={period} onValueChange={(next) => onPeriod(next as Period)} className="w-56">
            <SegmentedControlItem value="monthly">{copy.monthly}</SegmentedControlItem>
            <SegmentedControlItem value="yearly">{copy.yearly}</SegmentedControlItem>
          </SegmentedControl>
          <Badge variant={period === 'yearly' ? 'success' : 'secondary'} className="transition-colors yj-duration-base ease-standard">
            {copy.save(Math.round(YEARLY_DISCOUNT * 100))}
          </Badge>
        </div>
      </div>

      <RadioGroup aria-label={copy.plan} value={plan} onValueChange={(value) => onPlan(value as string)} className="grid gap-3">
          {plans.map((p) => (
            <FieldLabel key={p.id}>
              <Field orientation="horizontal" className="items-start">
                <RadioGroupItem value={p.id} className="mt-0.5" />
                <FieldContent className="gap-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <FieldTitle className="text-ui font-semibold">
                      {p.name}
                      {p.popular && <Badge className="ms-1">{copy.popular}</Badge>}
                    </FieldTitle>
                    <span className="flex items-baseline gap-1 text-fg-muted">
                      <Counter value={p.price * factor} format={{ style: 'currency', currency: copy.currency, maximumFractionDigits: 2, minimumFractionDigits: 2 }} locale={copy.locale} className="text-ui-lg font-semibold text-fg tabular-nums" />
                      <span className="text-ui-xs">{copy.perSeat(period)}</span>
                    </span>
                  </div>
                  <FieldDescription>{p.description}</FieldDescription>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-ui-sm text-fg-muted">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <CheckIcon size={13} strokeWidth={2.25} className="shrink-0 text-success-text" /> {f}
                      </li>
                    ))}
                  </ul>
                </FieldContent>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>

      <Field>
        <FieldLabel>{copy.seats}</FieldLabel>
        <NumberInput value={seats} min={1} max={500} onValueChange={(value) => onSeats(value ?? 1)} className="max-w-40" />
        <FieldDescription>{copy.seatsHint}</FieldDescription>
      </Field>
    </FieldGroup>
  )
}
