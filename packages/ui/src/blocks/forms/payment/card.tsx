'use client'

import { useLayoutEffect, useRef, type ChangeEvent, type KeyboardEvent, type RefObject } from 'react'
import { useWatch } from 'react-hook-form'
import { CreditCardIcon } from '@youj/icons'
import { MorphLabel } from '@youj/motion'
import { Badge } from '../../../components/ui/badge'
import { FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/form'
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../../components/ui/input-group'
import { brandOf, cvcLength, digitsOf, expiryParts, formatExpiry, formatNumber, numberDone, type PaymentFormCopy, type PaymentValues } from './data'

/* The card, typed the way a good payment form takes it. The number groups
 * itself as its brand prints it (4-4-4-4, Amex 4-6-5) without ever moving the
 * caret off the digit you're on, Backspace over a gap takes the digit before
 * it, and the brand appears at the end of the field as soon as the first
 * digits say which it is (and is read out). The expiry slashes itself (a 4
 * is April: "04 / "), the security code takes as many digits as the brand
 * prints, and each field hands focus on once it's complete and valid, so the
 * whole card is typed without reaching for the mouse. Numbers stay left to
 * right in a right-to-left page. */

/** Where the caret goes after `count` digits of a formatted value. */
function afterDigits(formatted: string, count: number) {
  if (count <= 0) return 0
  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i]!)) seen++
    if (seen === count) return i + 1
  }
  return formatted.length
}

const merge =
  <T,>(own: RefObject<T | null>, theirs: (node: T | null) => void) =>
  (node: T | null) => {
    own.current = node
    theirs(node)
  }

export function CardFields({ copy, now }: { copy: PaymentFormCopy; now: Date }) {
  const number = useWatch<PaymentValues, 'card.number'>({ name: 'card.number' })
  const digits = digitsOf(number)
  const brand = brandOf(digits)
  const refs = {
    number: useRef<HTMLInputElement>(null),
    expiry: useRef<HTMLInputElement>(null),
    cvc: useRef<HTMLInputElement>(null),
    name: useRef<HTMLInputElement>(null),
  }
  // The caret's place after a reformat, set once the new value has rendered.
  const caret = useRef<{ input: HTMLInputElement; at: number } | null>(null)
  useLayoutEffect(() => {
    const pending = caret.current
    caret.current = null
    if (pending && document.activeElement === pending.input) pending.input.setSelectionRange(pending.at, pending.at)
  })
  const handOn = (to: RefObject<HTMLInputElement | null>) => requestAnimationFrame(() => to.current?.focus())

  const setNumber = (input: HTMLInputElement, nextDigits: string, digitsBefore: number, onChange: (value: string) => void) => {
    const formatted = formatNumber(nextDigits)
    onChange(formatted)
    caret.current = { input, at: afterDigits(formatted, digitsBefore) }
    const atEnd = digitsBefore >= nextDigits.length
    if (atEnd && numberDone(nextDigits)) handOn(refs.expiry)
  }

  const cvcDigits = cvcLength(digits)
  return (
    <div className="grid gap-3 @sm/pay:grid-cols-2">
      <FormField<PaymentValues, 'card.number'>
        name="card.number"
        render={({ field, fieldState }) => (
          <FormItem className="@sm/pay:col-span-2">
            <FormLabel>{copy.cardNumber}</FormLabel>
            <InputGroup dir="ltr">
              <InputGroupInput
                ref={merge(refs.number, field.ref)}
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder={copy.cardNumberPlaceholder}
                aria-invalid={fieldState.invalid || undefined}
                className="font-mono tabular-nums"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const input = event.target
                  const before = digitsOf(input.value.slice(0, input.selectionStart ?? input.value.length)).length
                  setNumber(input, digitsOf(input.value), before, field.onChange)
                }}
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                  // Backspace just after a gap takes the digit before it, not only the gap.
                  const input = event.currentTarget
                  const at = input.selectionStart ?? 0
                  if (event.key !== 'Backspace' || at !== input.selectionEnd || input.value[at - 1] !== ' ') return
                  event.preventDefault()
                  const before = digitsOf(input.value.slice(0, at)).length
                  const all = digitsOf(input.value)
                  setNumber(input, all.slice(0, before - 1) + all.slice(before), before - 1, field.onChange)
                }}
              />
              <InputGroupAddon align="inline-end">
                <MorphLabel value={brand?.id ?? 'none'}>
                  {brand ? (
                    <Badge variant="outline" className="font-mono text-ui-xs tracking-wide uppercase">
                      {brand.name}
                    </Badge>
                  ) : (
                    <CreditCardIcon size={16} className="text-fg-subtle" />
                  )}
                </MorphLabel>
              </InputGroupAddon>
            </InputGroup>
            <span className="sr-only" aria-live="polite">
              {brand ? copy.brandLabel(brand.name) : ''}
            </span>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField<PaymentValues, 'card.expiry'>
        name="card.expiry"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{copy.expiry}</FormLabel>
            <InputGroup dir="ltr">
              <InputGroupInput
                ref={merge(refs.expiry, field.ref)}
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder={copy.expiryPlaceholder}
                aria-invalid={fieldState.invalid || undefined}
                className="font-mono tabular-nums"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const deleting = ((event.nativeEvent as InputEvent).inputType ?? '').startsWith('delete')
                  const next = formatExpiry(event.target.value, deleting)
                  field.onChange(next)
                  const parts = expiryParts(next)
                  const thisMonth = now.getFullYear() * 12 + now.getMonth()
                  if (parts && parts.month >= 1 && parts.month <= 12 && parts.year * 12 + parts.month - 1 >= thisMonth) handOn(refs.cvc)
                }}
              />
            </InputGroup>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField<PaymentValues, 'card.cvc'>
        name="card.cvc"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>{copy.cvc}</FormLabel>
            <InputGroup dir="ltr">
              <InputGroupInput
                ref={merge(refs.cvc, field.ref)}
                name={field.name}
                value={field.value}
                onBlur={field.onBlur}
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder={copy.cvcHint(cvcDigits, brand?.id === 'amex')}
                aria-invalid={fieldState.invalid || undefined}
                className="font-mono tabular-nums placeholder:font-sans"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const next = digitsOf(event.target.value).slice(0, cvcDigits)
                  field.onChange(next)
                  if (next.length === cvcDigits && next !== field.value) handOn(refs.name)
                }}
              />
            </InputGroup>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField<PaymentValues, 'card.name'>
        name="card.name"
        render={({ field, fieldState }) => (
          <FormItem className="@sm/pay:col-span-2">
            <FormLabel>{copy.cardName}</FormLabel>
            <InputGroup>
              <InputGroupInput {...field} ref={merge(refs.name, field.ref)} autoComplete="cc-name" aria-invalid={fieldState.invalid || undefined} />
            </InputGroup>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
