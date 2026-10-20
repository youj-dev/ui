'use client'

import { useMemo, useState, type ComponentProps, type ElementType, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form'
import { LockIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { Checkbox } from '../../components/ui/checkbox'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet, FieldTitle } from '../../components/ui/field'
import { Form, FormField } from '../../components/ui/form'
import { Input } from '../../components/ui/input'
import { PhoneInput } from '../../components/ui/phone-input'
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Eyebrow } from '../../components/ui/typography'
import { Wizard, WizardStep } from '../../components/ui/wizard'
import { cn } from '../../lib/utils'
import { formatPrice, MoneyContext, useMoneyFormat } from './product-card'
import {
  CHECKOUT_COPY,
  CHECKOUT_LINES,
  checkoutSchemas,
  COUNTRIES,
  SHIPPING_OPTIONS,
  totals,
  demo,
  wait,
  type CheckoutContact,
  type CheckoutCopy,
  type CheckoutLine,
  type CheckoutOrder,
  type CheckoutPayment,
  type CheckoutShipping,
  type CheckoutShippingOption,
} from './checkout/data'
import { Confirmed, Summary } from './checkout/summary'

/* Checkout as a Wizard: contact, shipping, payment, review. Each step is its
 * own react-hook-form + zod Form, so Continue validates only that step (the
 * Stepper marks a failed step and focus lands on the first bad field), and
 * Enter in any field advances. Shipping takes the address and a PhoneInput
 * for the courier; review reads everything back with a way to edit each part.
 * Placing the order runs through the Wizard's Finish (spinner, then a drawn
 * check), then the page turns into the confirmation: a check that draws
 * itself and lands on the settle spring, and the receipt rising in beneath
 * it. The order summary stays beside the form. Reduced motion: steps swap in
 * place and the check is simply drawn.
 *
 * Pass your `lines`, `shippingOptions` (more than one shows a picker),
 * `countries`, `taxRate`, `currency` and `locale`, and place the order through
 * `onPlaceOrder`; every string, validation messages included, is in `copy`.
 * It is built for the compact layout density (ui.css), taken from the page. */

/** Every step's form advances the Wizard on Enter; Continue validates through `trigger`. */
function Step<T extends Record<string, unknown>>({ form, onNext, children }: { form: UseFormReturn<T>; onNext: () => void; children: ReactNode }) {
  return (
    <Form form={form} onSubmit={onNext} className="grid gap-4 sm:grid-cols-2">
      {children}
      {/* Enter submits a form only when it has a submit button; the visible Continue lives in the Wizard's footer. */}
      <button type="submit" tabIndex={-1} aria-hidden className="sr-only" />
    </Form>
  )
}

function ReviewRow({ label, edit, editLabel, onEdit, children }: { label: string; edit: string; editLabel: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Eyebrow render={<dt />} className="text-ui-sm text-fg-muted">
          {label}
        </Eyebrow>
        <dd className="text-ui text-fg">{children}</dd>
      </div>
      <Button variant="link" size="sm" className="h-auto px-0" aria-label={editLabel} onClick={onEdit}>
        {edit}
      </Button>
    </div>
  )
}

interface CheckoutProps extends Omit<ComponentProps<'section'>, 'children'> {
  /** What's being bought, in the order summary. Default: the demo's two lines. */
  lines?: CheckoutLine[]
  /** The ways to ship; more than one shows a picker in the shipping step. Default: free standard delivery. */
  shippingOptions?: CheckoutShippingOption[]
  /** The chosen shipping option's id, controlled: pair it with `onShippingOptionChange`. */
  shippingOption?: string
  /** The shipping option chosen first, when the checkout owns it. Default: the first. */
  defaultShippingOption?: string
  onShippingOptionChange?: (id: string) => void
  /** The countries you ship to, code to name. Default: six demo countries. */
  countries?: Record<string, string>
  /** The share of the subtotal added as tax. Default 0.08. */
  taxRate?: number
  /** An ISO 4217 code. Default 'USD'. */
  currency?: string
  /** A BCP 47 locale for every amount. Default 'en-US'. */
  locale?: string
  /** The forms' starting values (a signed-in shopper's email and address, say). Default: empty, shipping to the US. */
  defaultValues?: { contact?: Partial<CheckoutContact>; shipping?: Partial<CheckoutShipping> }
  /** Places the order and resolves with its number; reject with an Error to shake Pay. Default: a short demo wait and 'NW-48213'. */
  onPlaceOrder?: (order: CheckoutOrder) => Promise<string> | string
  /** Where "Continue shopping" goes once confirmed. Default '#shop'. */
  shopHref?: string
  /** Renders the "Continue shopping" link, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: ElementType
  /** Any of the checkout's strings, to rewrite or translate. */
  copy?: Partial<CheckoutCopy>
}

function Checkout({
  lines = CHECKOUT_LINES,
  shippingOptions = SHIPPING_OPTIONS,
  shippingOption: optionProp,
  defaultShippingOption,
  onShippingOptionChange,
  countries = COUNTRIES,
  taxRate = 0.08,
  currency,
  locale,
  defaultValues,
  onPlaceOrder = async () => (await demo('Checkout: onPlaceOrder', 1200), 'NW-48213'),
  shopHref = '#shop',
  linkComponent = 'a',
  copy: copyProp,
  className,
  ...rest
}: CheckoutProps) {
  const copy = useMemo(() => ({ ...CHECKOUT_COPY, ...copyProp }), [copyProp])
  const schemas = useMemo(() => checkoutSchemas(copy), [copy])
  const money = useMoneyFormat(currency, locale)
  const [step, setStep] = useState(0)
  const [order, setOrder] = useState<string | null>(null)
  const [ownedOption, setOwnedOption] = useState(defaultShippingOption ?? shippingOptions[0]?.id)
  const option = shippingOptions.find((o) => o.id === (optionProp ?? ownedOption)) ?? shippingOptions[0] ?? SHIPPING_OPTIONS[0]!
  const chooseOption = (id: string) => {
    if (optionProp === undefined) setOwnedOption(id)
    onShippingOptionChange?.(id)
  }
  const figures = totals(lines, option.price, taxRate)

  const contact = useForm<CheckoutContact>({ resolver: zodResolver(schemas.contact), mode: 'onTouched', defaultValues: { email: '', news: true, ...defaultValues?.contact } })
  const shipping = useForm<CheckoutShipping>({
    resolver: zodResolver(schemas.shipping),
    mode: 'onTouched',
    defaultValues: { name: '', address: '', city: '', postal: '', country: Object.keys(countries)[0] ?? '', phone: '', ...defaultValues?.shipping },
  })
  const payment = useForm<CheckoutPayment>({ resolver: zodResolver(schemas.payment), mode: 'onTouched', defaultValues: { card: '', expiry: '', cvc: '', holder: '' } })
  const next = () => setStep((s) => Math.min(3, s + 1))

  const c = useWatch({ control: contact.control }) as CheckoutContact
  const s = useWatch({ control: shipping.control }) as CheckoutShipping
  const p = useWatch({ control: payment.control }) as CheckoutPayment

  return (
    <MoneyContext.Provider value={money}>
      <section aria-labelledby="checkout-title" className={cn('min-h-dvh bg-canvas py-10 md:py-14', className)} {...rest}>
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <h1 id="checkout-title" className="text-3xl font-semibold tracking-tight text-fg">
              {copy.title}
            </h1>
            <span className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
              <LockIcon size={14} /> {copy.secure}
            </span>
          </div>
          {order ? (
            <Confirmed copy={copy} email={c.email} orderNumber={order} total={figures.total} shopHref={shopHref} linkComponent={linkComponent} />
          ) : (
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <Wizard
                headingLevel={2}
                step={step}
                onStepChange={setStep}
                finishLabel={copy.pay(formatPrice(figures.total, money))}
                finishSuccessLabel={copy.placed}
                onComplete={async () => {
                  const number = await onPlaceOrder({ contact: contact.getValues(), shipping: shipping.getValues(), payment: payment.getValues(), lines, shippingOption: option, ...figures })
                  await wait(400) // lint-blocks-allow: lets Pay show its success before the confirmation replaces it
                  setOrder(number)
                }}
              >
                <WizardStep id="contact" title={copy.contactTitle} description={copy.contactDescription} validate={() => contact.trigger(undefined, { shouldFocus: true })}>
                  <Step form={contact} onNext={next}>
                    <FormField name="email" label={copy.email} required className="sm:col-span-2">
                      {(field) => <Input {...field} type="email" autoComplete="email" placeholder={copy.emailPlaceholder} />}
                    </FormField>
                    <FormField name="news" orientation="horizontal" className="sm:col-span-2">
                      {(field) => (
                        <label className="flex items-center gap-2.5 text-ui text-fg">
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} onBlur={field.onBlur} name={field.name} />
                          {copy.news}
                        </label>
                      )}
                    </FormField>
                  </Step>
                </WizardStep>
                <WizardStep id="shipping" title={copy.shippingTitle} description={copy.shippingDescription} validate={() => shipping.trigger(undefined, { shouldFocus: true })}>
                  <Step form={shipping} onNext={next}>
                    <FormField name="name" label={copy.name} required className="sm:col-span-2">
                      {(field) => <Input {...field} autoComplete="name" placeholder={copy.namePlaceholder} />}
                    </FormField>
                    <FormField name="address" label={copy.address} required className="sm:col-span-2">
                      {(field) => <Input {...field} autoComplete="street-address" placeholder={copy.addressPlaceholder} />}
                    </FormField>
                    <FormField name="city" label={copy.city} required>
                      {(field) => <Input {...field} autoComplete="address-level2" />}
                    </FormField>
                    <FormField name="postal" label={copy.postal} required>
                      {(field) => <Input {...field} autoComplete="postal-code" />}
                    </FormField>
                    <FormField name="country" label={copy.country} required>
                      {(field) => (
                        <Select items={countries} value={field.value} onValueChange={(value) => field.onChange(value ?? '')}>
                          <SelectTrigger ref={field.ref} onBlur={field.onBlur} className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(countries).map(([code, name]) => (
                              <SelectItem key={code} value={code}>
                                {name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </FormField>
                    <FormField name="phone" label={copy.phone} required description={copy.phoneDescription}>
                      {(field) => <PhoneInput value={field.value} onValueChange={(value) => field.onChange(value)} defaultCountry={s.country} name={field.name} />}
                    </FormField>
                    {shippingOptions.length > 1 && (
                      <FieldSet className="sm:col-span-2">
                        <FieldLegend variant="label">{copy.shippingMethod}</FieldLegend>
                        <RadioGroup value={option.id} onValueChange={(value) => chooseOption(value as string)}>
                          {shippingOptions.map((o) => (
                            <FieldLabel key={o.id}>
                              <Field orientation="horizontal">
                                <RadioGroupItem value={o.id} />
                                <FieldContent>
                                  <FieldTitle>{o.label}</FieldTitle>
                                  {o.description && <FieldDescription>{o.description}</FieldDescription>}
                                </FieldContent>
                                <span className="font-mono text-ui tabular-nums">{o.price ? formatPrice(o.price, money) : copy.free}</span>
                              </Field>
                            </FieldLabel>
                          ))}
                        </RadioGroup>
                      </FieldSet>
                    )}
                  </Step>
                </WizardStep>
                <WizardStep id="payment" title={copy.paymentTitle} description={copy.paymentDescription} validate={() => payment.trigger(undefined, { shouldFocus: true })}>
                  <Step form={payment} onNext={next}>
                    <FormField name="card" label={copy.card} required className="sm:col-span-2">
                      {(field) => <Input {...field} inputMode="numeric" autoComplete="cc-number" placeholder={copy.cardPlaceholder} />}
                    </FormField>
                    <FormField name="expiry" label={copy.expiry} required>
                      {(field) => <Input {...field} inputMode="numeric" autoComplete="cc-exp" placeholder={copy.expiryPlaceholder} />}
                    </FormField>
                    <FormField name="cvc" label={copy.cvc} required>
                      {(field) => <Input {...field} inputMode="numeric" autoComplete="cc-csc" placeholder={copy.cvcPlaceholder} />}
                    </FormField>
                    <FormField name="holder" label={copy.holder} required className="sm:col-span-2">
                      {(field) => <Input {...field} autoComplete="cc-name" />}
                    </FormField>
                  </Step>
                </WizardStep>
                <WizardStep id="review" title={copy.reviewTitle} description={copy.reviewDescription}>
                  <dl className="flex flex-col divide-y divide-line">
                    <ReviewRow label={copy.contactTitle} edit={copy.edit} editLabel={copy.editLabel(copy.contactTitle)} onEdit={() => setStep(0)}>
                      {c.email}
                    </ReviewRow>
                    <ReviewRow label={copy.shipTo} edit={copy.edit} editLabel={copy.editLabel(copy.shipTo)} onEdit={() => setStep(1)}>
                      {s.name}, {s.address}, {s.city} {s.postal}, {countries[s.country]} · {s.phone}
                    </ReviewRow>
                    <ReviewRow label={copy.paymentTitle} edit={copy.edit} editLabel={copy.editLabel(copy.paymentTitle)} onEdit={() => setStep(2)}>
                      {copy.cardEnding(p.card.replace(/\s/g, '').slice(-4), p.expiry)}
                    </ReviewRow>
                  </dl>
                </WizardStep>
              </Wizard>
              <Summary copy={copy} lines={lines} option={option} figures={figures} />
            </div>
          )}
        </div>
      </section>
    </MoneyContext.Provider>
  )
}

export { Checkout, CHECKOUT_COPY }
export type { CheckoutContact, CheckoutCopy, CheckoutLine, CheckoutOrder, CheckoutPayment, CheckoutProps, CheckoutShipping, CheckoutShippingOption }
