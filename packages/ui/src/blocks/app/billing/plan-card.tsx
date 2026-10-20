'use client'

import { Counter } from '@youj/motion'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { Eyebrow } from '../../../components/ui/typography'
import { periodTotal, seatPrice, type BillingCopy, type BillingCycle, type BillingPlan } from './data'

/** The plan the workspace is on and what the next invoice will be. */
export function PlanCard({
  plan,
  cycle,
  seats,
  copy,
  money,
  locale,
  currency,
  onChange,
}: {
  plan: BillingPlan
  cycle: BillingCycle
  seats: number
  copy: BillingCopy
  money: (value: number) => string
  locale: string
  currency: string
  onChange: () => void
}) {
  const total = periodTotal(plan, cycle, seats)
  return (
    <Card>
      <CardHeader>
        <CardDescription>{copy.currentPlan}</CardDescription>
        <CardTitle className="flex items-center gap-2 text-(length:--ui--panel-title) leading-(--ui--panel-title-leading)">
          {plan.name}
          <Badge variant="secondary">{cycle === 'annual' ? copy.annual : copy.monthly}</Badge>
        </CardTitle>
        <CardAction>
          <Button variant="outline" size="sm" onClick={onChange}>
            {copy.changePlan}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Eyebrow render={<dt />}>{copy.perSeat}</Eyebrow>
            <dd className="text-ui text-fg tabular-nums">
              {money(Math.round(seatPrice(plan, cycle) * 100) / 100)} <span className="text-fg-muted">{copy.perMonth}</span>
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <Eyebrow render={<dt />}>{copy.seats}</Eyebrow>
            <dd className="text-ui text-fg tabular-nums">{seats}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <Eyebrow render={<dt />}>{cycle === 'annual' ? copy.renews : copy.nextInvoice}</Eyebrow>
            <dd className="text-ui text-fg">{cycle === 'annual' ? copy.renewsDate : copy.nextInvoiceDate}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="flex items-baseline justify-between gap-3 border-t border-line">
        <span className="text-ui text-fg-muted">{cycle === 'annual' ? copy.billedYearly : copy.billedMonthly}</span>
        <span className="text-2xl font-semibold tracking-tight text-fg tabular-nums">
          <Counter value={total} locale={locale} format={{ style: 'currency', currency, maximumFractionDigits: 0 }} duration="base" />
        </span>
      </CardFooter>
    </Card>
  )
}
