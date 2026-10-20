'use client'

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type HTMLAttributes, type ReactNode } from 'react'
import { useForm, useWatch, type FieldErrors, type Resolver } from 'react-hook-form'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { LockIcon } from '@youj/icons'
import { Collapse } from '@youj/motion'
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Checkbox } from '../../components/ui/checkbox'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet } from '../../components/ui/field'
import { Form, FormField, FormItem, FormLabel, FormMessage, FormSubmit } from '../../components/ui/form'
import { InputGroup, InputGroupInput } from '../../components/ui/input-group'
import { cn, numberFormat } from '../../lib/utils'
import { AddressFields } from './payment/address'
import { CardFields } from './payment/card'
import {
  brandName,
  brandOf,
  DEFAULT_COPY,
  demo,
  demoSearch,
  digitsOf,
  EMPTY_VALUES,
  expiryParts,
  PAYMENT_COUNTRIES,
  type PaymentAddress,
  type PaymentAddressSuggestion,
  type PaymentBrand,
  type PaymentCountry,
  type PaymentDetails,
  type PaymentFormCopy,
  type PaymentValues,
} from './payment/data'
import { nested, problems, tidyTax } from './payment/rules'

/* Payment details the way the best checkouts take them, in one card: the
 * card (brand-aware, formatted as it's typed, handing focus on field by
 * field, checked against its brand, length, checksum and expiry), the
 * billing address in the country's own order and terms with a lookup on its
 * first line, and a business purchase's company and tax number, checked in
 * the country's format. Every field checks itself when you leave it; Pay
 * checks them all and focuses the first problem; a declined payment keeps
 * everything and says why. Reduced motion: nothing slides; lit fields and
 * messages still show.
 *
 * The card fields are for prototypes and for providers whose SDK lets you
 * own the inputs. In production, pass your provider's own element (Stripe's
 * Payment Element, Adyen's card component) as `card` and it takes their
 * place; the address and business details stay. Look addresses up through
 * `onSearchAddress`, prefill and keep the address with `address` /
 * `defaultAddress` / `onAddressChange`, and pay through `onSubmit`; every
 * string is in `copy`. */

interface PaymentFormProps extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onSubmit'> {
  /** Wraps the block in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A panel inside another page: an `h2` instead of the page's `h1`, and no page around it. Default true; `false` draws its own page around it (a centered canvas and an `h1`). */
  embedded?: boolean
  /** Take the whole width it's given instead of stopping at its natural width (544px at 100% scale). Default false. */
  fill?: boolean
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<PaymentFormCopy>
  /** Formats the amount (BCP 47). Default: `copy.locale`, else the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** What's charged, in `currency`; Pay shows it. Without it the button saves the details instead. */
  amount?: number
  /** ISO 4217. Default 'USD'. */
  currency?: string
  /** The countries billed to, each with its address format. Default: eight, from the United States to Japan. */
  countries?: PaymentCountry[]
  /** The card brands you take; others are refused by name. Default: every brand. */
  brands?: PaymentBrand[]
  /** Your provider's card element, in place of the card fields. */
  card?: ReactNode
  /** The billing address, controlled: pair it with `onAddressChange`. */
  address?: Partial<PaymentAddress>
  /** The billing address to start from (the account's, say). Default: empty, in the first country. */
  defaultAddress?: Partial<PaymentAddress>
  /** Called with the address as it changes. */
  onAddressChange?: (address: PaymentAddress) => void
  /** Looks addresses up for what's typed on the first line, in the chosen country. Default: a few demo addresses per country. */
  onSearchAddress?: (query: string, country: string) => Promise<PaymentAddressSuggestion[]> | PaymentAddressSuggestion[]
  /** Pays (or saves the details). Reject with an Error to say why (a declined card); everything typed is kept. Default: a short demo wait. */
  onSubmit?: (details: PaymentDetails) => Promise<unknown> | unknown
  /** Offer the business purchase (company and tax number). Default true. */
  business?: boolean
  /** Today, for checking the card's expiry. Default: the moment the block mounts. */
  now?: Date
}

function PaymentForm({
  theme,
  embedded = true,
  fill = false,
  copy: copyProp,
  locale,
  amount,
  currency = 'USD',
  countries = PAYMENT_COUNTRIES,
  brands = [],
  card,
  address,
  defaultAddress,
  onAddressChange,
  onSearchAddress,
  onSubmit,
  business: offerBusiness = true,
  now,
  className,
  ...rest
}: PaymentFormProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp, locale: useLocale(locale ?? copyProp?.locale) }
  const plural = useMemo(() => new Intl.PluralRules(copy.locale), [copy.locale])
  const money = useMemo(() => (amount === undefined ? '' : numberFormat(copy.locale, { style: 'currency', currency }).format(amount)), [amount, currency, copy.locale])
  const [mountedAt] = useState(() => new Date())
  const today = now ?? mountedAt
  const titleId = useId()
  const Title = embedded ? 'h2' : 'h1'
  const [failure, setFailure] = useState<string | null>(null)

  const first = countries[0] ?? PAYMENT_COUNTRIES[0]!
  const start = (given?: Partial<PaymentAddress>): PaymentValues => ({ ...EMPTY_VALUES, address: { ...EMPTY_VALUES.address, country: first.code, ...given } })
  const countryOf = (code: string) => countries.find((c) => c.code === code) ?? first

  const resolver: Resolver<PaymentValues> = (values) => {
    const found = problems(values, { country: countryOf(values.address.country), copy, now: today, brands, ownCard: !card })
    return Object.keys(found).length ? { values: {}, errors: nested(found) as FieldErrors<PaymentValues> } : { values, errors: {} }
  }
  const form = useForm<PaymentValues>({
    defaultValues: start(address ?? defaultAddress),
    values: address ? start(address) : undefined,
    resetOptions: { keepDirtyValues: true },
    resolver,
    mode: 'onTouched',
  })
  const country = countryOf(useWatch({ control: form.control, name: 'address.country' }))
  const buying = useWatch({ control: form.control, name: 'business' })

  // The address goes out as it changes; the card never does.
  const latest = useRef(onAddressChange)
  useLayoutEffect(() => {
    latest.current = onAddressChange
  })
  useEffect(() => {
    return form.subscribe({
      formState: { values: true },
      callback: ({ values, name }) => {
        if (name?.startsWith('address.')) latest.current?.(values.address as PaymentAddress)
      },
    })
  }, [form])

  const submit = async (values: PaymentValues) => {
    setFailure(null)
    const digits = digitsOf(values.card.number)
    const expiry = expiryParts(values.card.expiry)
    const postal = country.postal.normalize ? country.postal.normalize(values.address.postal) : values.address.postal.trim()
    const details: PaymentDetails = {
      ...(card
        ? {}
        : {
            card: {
              number: digits,
              brand: brandOf(digits)?.id ?? null,
              last4: digits.slice(-4),
              expMonth: expiry?.month ?? 0,
              expYear: expiry?.year ?? 0,
              cvc: values.card.cvc,
              name: values.card.name.trim(),
            },
          }),
      address: { ...values.address, postal, region: country.region ? values.address.region : '' },
      business: offerBusiness && values.business ? { company: values.company.trim(), taxId: tidyTax(values.taxId) } : null,
    }
    try {
      await (onSubmit ? onSubmit(details) : demo('PaymentForm: onSubmit', 1200))
    } catch (cause) {
      setFailure(cause instanceof Error && cause.message ? cause.message : copy.failedDescription)
      throw cause
    }
  }

  const legend = 'text-ui font-semibold text-fg'
  const shown = brands.length ? brands : (['visa', 'mastercard', 'amex', 'discover'] as PaymentBrand[])
  const content = (
    <Form form={form} onSubmit={submit} className="flex flex-col">
      <header className="flex flex-col gap-1 px-(--ui--panel-x) py-(--ui--panel-head-y)">
        <Title id={titleId} className="text-xl leading-tight font-semibold tracking-tight">
          {copy.title}
        </Title>
        <p className="text-ui text-fg-muted">{copy.description}</p>
      </header>

      <FieldSet className="gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        <div className="flex items-center justify-between gap-3">
          <FieldLegend className={legend}>{copy.card}</FieldLegend>
          {!card && (
            <ul aria-hidden className="flex flex-wrap justify-end gap-1">
              {shown.map((id) => (
                <li key={id}>
                  <Badge variant="outline" className="font-mono text-ui-xs tracking-wide text-fg-muted uppercase">
                    {brandName(id)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
        {card ?? <CardFields copy={copy} now={today} />}
      </FieldSet>

      <FieldSet className="gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        <FieldLegend className={legend}>{copy.billing}</FieldLegend>
        <AddressFields countries={countries} country={country} copy={copy} plural={plural} search={onSearchAddress ?? demoSearch} />
      </FieldSet>

      {offerBusiness && (
        <div className="flex flex-col border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
          <FormField<PaymentValues, 'business'>
            name="business"
            render={({ field }) => (
              <Field orientation="horizontal">
                <Checkbox ref={field.ref} checked={field.value} onCheckedChange={field.onChange} onBlur={field.onBlur} />
                <FieldContent>
                  <FieldLabel>{copy.business}</FieldLabel>
                  <FieldDescription>{copy.businessHint}</FieldDescription>
                </FieldContent>
              </Field>
            )}
          />
          <Collapse open={buying}>
            <div className="grid gap-3 pt-4 @sm/pay:grid-cols-2">
              <FormField<PaymentValues, 'company'>
                name="company"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>{copy.company}</FormLabel>
                    <InputGroup>
                      <InputGroupInput {...field} autoComplete="organization" aria-invalid={fieldState.invalid || undefined} />
                    </InputGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField<PaymentValues, 'taxId'>
                name="taxId"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      {country.tax.label}
                      {country.tax.optional && <span className="font-normal text-fg-subtle"> ({copy.optional})</span>}
                    </FormLabel>
                    <InputGroup dir="ltr">
                      <InputGroupInput
                        {...field}
                        placeholder={country.tax.example}
                        spellCheck={false}
                        aria-invalid={fieldState.invalid || undefined}
                        className="font-mono uppercase placeholder:normal-case"
                        onBlur={() => {
                          const tidy = tidyTax(field.value)
                          if (tidy !== field.value) form.setValue('taxId', tidy, { shouldDirty: true })
                          field.onBlur()
                        }}
                      />
                    </InputGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Collapse>
        </div>
      )}

      <footer className="flex flex-col gap-3 border-t border-line px-(--ui--panel-x) py-(--ui--panel-y)">
        {amount !== undefined && (
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-ui text-fg-muted">{copy.dueToday}</span>
            <span className="font-mono text-ui-lg font-semibold text-fg tabular-nums">{money}</span>
          </div>
        )}
        {failure && (
          <Alert variant="danger">
            <AlertTitle>{copy.failedTitle}</AlertTitle>
            <AlertDescription>{failure}</AlertDescription>
          </Alert>
        )}
        <FormSubmit size="lg" className="w-full" pendingLabel={copy.paying} successLabel={amount !== undefined ? copy.paid : copy.saved} errorLabel={copy.failed} invalidLabel={copy.invalidForm}>
          {amount !== undefined ? copy.pay(money) : copy.save}
        </FormSubmit>
        <p className="flex items-center justify-center gap-1.5 text-center text-ui-sm text-fg-muted">
          <LockIcon size={13} className="shrink-0" />
          {copy.secure}
        </p>
      </footer>
    </Form>
  )

  const panel = (
    <article
      aria-labelledby={titleId}
      {...(embedded ? rest : null)}
      className={cn(
        '@container/pay w-full rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-surface text-fg',
        embedded ? 'shadow-sm' : 'shadow-lg',
        !fill && 'max-w-136',
        embedded && className,
      )}
    >
      {content}
    </article>
  )
  const shell = embedded ? (
    panel
  ) : (
    <main {...rest} className={cn('grid min-h-dvh w-full place-items-center bg-canvas px-4 py-10 text-fg', className)}>
      {panel}
    </main>
  )
  return theme ? <ThemeScope theme={theme}>{shell}</ThemeScope> : shell
}

export { PaymentForm, DEFAULT_COPY as PAYMENT_FORM_COPY, PAYMENT_COUNTRIES }
export type { PaymentAddress, PaymentAddressSuggestion, PaymentBrand, PaymentCountry, PaymentDetails, PaymentFormCopy, PaymentFormProps, PaymentValues }
