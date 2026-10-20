'use client'

import { useState, type ReactNode } from 'react'
import { Collapse, Counter } from '@youj/motion'
import { TagIcon, XIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Field, FieldError, FieldLabel } from '../../../components/ui/field'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../../../components/ui/input-group'
import { Separator } from '../../../components/ui/separator'
import { money, quote, type Country, type Period, type Plan, type SubscriptionCheckoutCopy } from './data'

function Line({ label, children, tone }: { label: ReactNode; children: ReactNode; tone?: 'success' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <dt className="min-w-0 text-fg-muted">{label}</dt>
      <dd className={tone === 'success' ? 'text-success-text tabular-nums' : 'text-fg tabular-nums'}>{children}</dd>
    </div>
  )
}

function PromoCode({ applied, codes, copy, onApply }: { applied?: string; codes: Record<string, number>; copy: SubscriptionCheckoutCopy; onApply: (code?: string) => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string>()
  const apply = () => {
    const code = value.trim().toUpperCase()
    if (!code) return
    if (!(code in codes)) return setError(copy.promoInvalid(code))
    onApply(code)
    setValue('')
  }
  if (applied) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-dashed border-success-line bg-success-subtle py-1 ps-3 pe-1 text-ui-sm">
        <span className="flex min-w-0 items-center gap-2 text-success-text">
          <TagIcon trigger="mount" size={14} className="shrink-0" />
          <span className="truncate font-medium">{copy.promoApplied(applied, Math.round(codes[applied]! * 100))}</span>
        </span>
        <Button variant="ghost" size="icon-xs" aria-label={copy.removePromo(applied)} onClick={() => onApply(undefined)}>
          <XIcon size={14} />
        </Button>
      </div>
    )
  }
  return (
    <Field invalid={!!error}>
      <FieldLabel>{copy.promo}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          value={value}
          placeholder={copy.promoPlaceholder}
          autoCapitalize="characters"
          spellCheck={false}
          className="uppercase placeholder:normal-case"
          onChange={(event) => {
            setValue(event.target.value)
            setError(undefined)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              apply()
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton disabled={!value.trim()} onClick={apply}>
            {copy.apply}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldError>{error}</FieldError>
    </Field>
  )
}

export function OrderSummary({
  plan,
  period,
  seats,
  country,
  promo,
  codes,
  copy,
  onPromo,
}: {
  plan: Plan
  period: Period
  seats: number
  country: Country
  promo?: string
  codes: Record<string, number>
  copy: SubscriptionCheckoutCopy
  onPromo: (code?: string) => void
}) {
  const q = quote(plan, period, seats, promo ? (codes[promo] ?? 0) : 0, country.taxRate)
  const currency = { style: 'currency', currency: copy.currency } as const
  return (
    <Card className="lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle>
          <h2>{copy.summary}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="font-medium text-fg">
              {plan.name} <Badge variant="secondary">{period === 'yearly' ? copy.yearly : copy.monthly}</Badge>
            </span>
            <span className="text-ui-sm text-fg-muted tabular-nums">{copy.seatLine(seats, money(plan.price, copy), period)}</span>
          </div>
          <Counter value={q.list} format={currency} locale={copy.locale} className="text-ui text-fg tabular-nums" />
        </div>
        <Separator />
        {/* A dl may only hold dt/dd groups, so each line that collapses is a list of its own. */}
        <div className="-my-1 flex flex-col text-ui">
          <Collapse open={q.yearly > 0}>
            <dl>
              <Line label={copy.yearlyDiscount} tone="success">
                −{money(q.yearly, copy)}
              </Line>
            </dl>
          </Collapse>
          <Collapse open={q.discount > 0}>
            <dl>
              <Line label={promo} tone="success">
                −{money(q.discount, copy)}
              </Line>
            </dl>
          </Collapse>
          <dl>
            <Line label={copy.subtotal}>
              <Counter value={q.subtotal} format={currency} locale={copy.locale} />
            </Line>
            <Line label={copy.tax(country.taxLabel, Math.round(country.taxRate * 100))}>
              <Counter value={q.tax} format={currency} locale={copy.locale} />
            </Line>
          </dl>
        </div>
        <Separator />
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-medium text-fg">{copy.total}</span>
          <Counter value={q.total} format={currency} locale={copy.locale} aria-live="polite" className="text-xl font-semibold tracking-tight text-fg tabular-nums" />
        </div>
        <p className="-mt-2 text-ui-sm text-fg-muted">{copy.renews(money(q.total, copy), period)}</p>
        <PromoCode applied={promo} codes={codes} copy={copy} onApply={onPromo} />
      </CardContent>
    </Card>
  )
}
