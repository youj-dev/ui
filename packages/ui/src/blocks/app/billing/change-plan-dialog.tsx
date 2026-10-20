'use client'

import { useId, useState } from 'react'
import { useYouj } from '@youj/core'
import { Counter } from '@youj/motion'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '../../../components/ui/field'
import { RadioGroup, RadioGroupItem } from '../../../components/ui/radio-group'
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group'
import { periodTotal, seatPrice, demo, type BillingCopy, type BillingCycle, type BillingPlan } from './data'

/**
 * Pick a plan and a cycle. Prices retarget (Counter) as the cycle flips, and
 * the footer states what the next invoice becomes before anything changes.
 */
export function ChangePlanDialog({
  open,
  onOpenChange,
  plan,
  cycle,
  plans,
  seats,
  copy,
  money,
  locale,
  currency,
  onChangePlan,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: BillingPlan
  cycle: BillingCycle
  plans: BillingPlan[]
  seats: number
  copy: BillingCopy
  money: (value: number) => string
  locale: string
  currency: string
  /** Makes the change; resolve when done, throw to show the error. Default: a demo wait. */
  onChangePlan?: (change: { plan: BillingPlan; cycle: BillingCycle }) => Promise<unknown> | unknown
  onConfirm: (plan: BillingPlan, cycle: BillingCycle) => void
}) {
  const k = useYouj()
  const cycleId = useId()
  const [next, setNext] = useState({ plan: plan.id, cycle })
  const [error, setError] = useState<string>()
  const chosen = plans.find((p) => p.id === next.plan) ?? plan
  const unchanged = chosen.id === plan.id && next.cycle === cycle

  return (
    <Dialog open={open} onOpenChange={onOpenChange} onOpenChangeComplete={(isOpen) => {
        if (!isOpen) return
        setNext({ plan: plan.id, cycle })
        setError(undefined)
      }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.changePlanTitle}</DialogTitle>
          <DialogDescription>{copy.changePlanDescription(seats)}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between gap-3">
          <span id={cycleId} className="text-ui font-medium text-fg">
            {copy.billingCycle}
          </span>
          <ToggleGroup
            variant="segmented"
            aria-labelledby={cycleId}
            value={[next.cycle]}
            onValueChange={(value: unknown[]) => value[0] && setNext((n) => ({ ...n, cycle: value[0] as BillingCycle }))}
            className="w-56"
          >
            <ToggleGroupItem value="monthly">{copy.monthly}</ToggleGroupItem>
            <ToggleGroupItem value="annual">
              {copy.annual} <span className="text-ui-xs text-success-text">{copy.annualSaving}</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <RadioGroup aria-label={copy.planLabel} value={next.plan} onValueChange={(value) => setNext((n) => ({ ...n, plan: value as string }))}>
          {plans.map((p) => (
            <FieldLabel key={p.id}>
              <Field orientation="horizontal">
                <RadioGroupItem value={p.id} />
                <FieldContent>
                  <FieldTitle>
                    {p.name}
                    {p.id === plan.id && <Badge variant="secondary">{copy.currentBadge}</Badge>}
                  </FieldTitle>
                  <FieldDescription>{p.blurb}</FieldDescription>
                </FieldContent>
                <span className="shrink-0 text-end text-ui text-fg tabular-nums">
                  <Counter value={Math.round(seatPrice(p, next.cycle) * 100) / 100} locale={locale} format={{ style: 'currency', currency, maximumFractionDigits: 2 }} duration="fast" />
                  <span className="block text-ui-xs text-fg-muted">{copy.perSeatMonth}</span>
                </span>
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        <DialogFooter className="items-center sm:justify-between">
          <p className="text-ui-sm text-fg-muted" aria-live="polite">
            {error ?? (unchanged ? copy.noChange : copy.changeFrom(money(periodTotal(chosen, next.cycle, seats)), next.cycle))}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {copy.cancel}
            </Button>
            <AsyncButton
              disabled={unchanged}
              pendingLabel={copy.updating}
              successLabel={copy.planUpdated}
              onAction={async () => {
                setError(undefined)
                try {
                  await (onChangePlan ? onChangePlan({ plan: chosen, cycle: next.cycle }) : demo('Billing: onChangePlan', 800))
                } catch (failure) {
                  if (failure instanceof Error && failure.message) setError(failure.message)
                  throw failure
                }
                onConfirm(chosen, next.cycle)
              }}
              onActionStateChange={(state) => state === 'success' && setTimeout(() => onOpenChange(false), k.ms('deliberate'))}
            >
              {copy.confirmChange}
            </AsyncButton>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
