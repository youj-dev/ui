'use client'

import type { ReactNode } from 'react'
import { CreditCardIcon } from '@youj/icons'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { Field, FieldError, FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../../components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { COUNTRIES, formatExpiry, groupCard, paymentErrors, type Country, type Payment, type SubscriptionCheckoutCopy } from './data'

/* Plain inputs standing in for a payment provider's secure fields: nothing
 * here is sent anywhere. Replace the card fields with your provider's
 * elements before taking real payments. */

export function PaymentStep({
  value,
  onChange,
  showErrors,
  copy,
  countries = COUNTRIES,
}: {
  value: Payment
  onChange: (next: Payment) => void
  showErrors: boolean
  copy: SubscriptionCheckoutCopy
  countries?: Country[]
}) {
  const errors = showErrors ? paymentErrors(value, copy) : {}
  const set = (key: keyof Payment) => (next: string) => onChange({ ...value, [key]: next })
  const field = (key: keyof Payment, label: string, control: ReactNode, className?: string) => (
    <Field invalid={!!errors[key]} className={className}>
      <FieldLabel>{label}</FieldLabel>
      {control}
      <FieldError>{errors[key]}</FieldError>
    </Field>
  )

  return (
    <FieldGroup className="gap-5">
      <Alert variant="warning">
        <AlertTitle>{copy.placeholderTitle}</AlertTitle>
        <AlertDescription>{copy.placeholderDescription}</AlertDescription>
      </Alert>
      {field('email', copy.email, <Input type="email" autoComplete="email" dir="ltr" value={value.email} onChange={(e) => set('email')(e.target.value)} />)}
      {field('holder', copy.holder, <Input autoComplete="cc-name" value={value.holder} onChange={(e) => set('holder')(e.target.value)} />)}
      {field(
        'card',
        copy.card,
        <InputGroup dir="ltr">
          <InputGroupAddon>
            <CreditCardIcon size={16} />
          </InputGroupAddon>
          <InputGroupInput inputMode="numeric" autoComplete="cc-number" placeholder={copy.cardPlaceholder} className="font-mono tabular-nums" value={value.card} onChange={(e) => set('card')(groupCard(e.target.value))} />
        </InputGroup>,
      )}
      <div className="grid grid-cols-2 gap-4">
        {field('expiry', copy.expiry, <Input inputMode="numeric" autoComplete="cc-exp" placeholder={copy.expiryPlaceholder} dir="ltr" className="font-mono tabular-nums" value={value.expiry} onChange={(e) => set('expiry')(formatExpiry(e.target.value))} />)}
        {field('cvc', copy.cvc, <Input inputMode="numeric" autoComplete="cc-csc" placeholder={copy.cvcPlaceholder} dir="ltr" maxLength={4} className="font-mono tabular-nums" value={value.cvc} onChange={(e) => set('cvc')(e.target.value.replace(/\D/g, ''))} />)}
      </div>
      <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4">
        <Field>
          <FieldLabel>{copy.country}</FieldLabel>
          <Select items={countries.map((c) => ({ value: c.code, label: c.name }))} value={value.country} onValueChange={(next) => set('country')(next as string)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {field('postal', copy.postal, <Input autoComplete="postal-code" value={value.postal} className="uppercase" onChange={(e) => set('postal')(e.target.value)} />)}
      </div>
    </FieldGroup>
  )
}
