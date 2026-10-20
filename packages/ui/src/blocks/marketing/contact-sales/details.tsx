'use client'

import { useId, useMemo, useState } from 'react'
import { ArrowRightIcon } from '@youj/icons'
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert'
import { AsyncButton } from '../../../components/ui/async-button'
import { Button } from '../../../components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { NativeSelect, NativeSelectOption } from '../../../components/ui/native-select'
import { Textarea } from '../../../components/ui/textarea'
import { PERSONAL, type ContactSalesCopy, type ContactSalesErrors, type ContactSalesRegion, type ContactSalesValues } from './data'
import { Person } from './person'
import { Ticket } from './ticket'
import { dateTimeFormat } from '../../../lib/utils'

/* Step two: who. For a call, the chosen time pinned on top as a ticket (with
 * a way back to change it), then three short rows of fields; for a message,
 * the person who replies (and the region, which decides who that is), the
 * same fields and the message. Every field is checked when the button is
 * pressed: each problem is said under its field, the first is focused, and
 * the button reports it; fixing a field clears its message. A failed send
 * keeps everything typed and raises an alert. */

interface DetailsProps {
  /** The step's heading level, one below the section's. */
  heading: 'h2' | 'h3' | 'h4'
  mode: 'call' | 'message'
  values: ContactSalesValues
  set: <K extends keyof ContactSalesValues>(key: K, value: ContactSalesValues[K]) => void
  regions: ContactSalesRegion[]
  region: ContactSalesRegion | undefined
  onRegionChange: (id: string) => void
  sizes: string[]
  topics: string[]
  requireWorkEmail: boolean
  maxMessage: number
  locale: string
  copy: ContactSalesCopy
  /** Validated values, ready to send: resolves once sent, rejects to keep the form. */
  onSend: (values: ContactSalesValues) => Promise<void>
  onChangeTime: () => void
  onCall: () => void
}

export function Details({ heading: Heading, mode, values, set, regions, region, onRegionChange, sizes, topics, requireWorkEmail, maxMessage, locale, copy, onSend, onChangeTime, onCall }: DetailsProps) {
  const base = useId()
  const [errors, setErrors] = useState<ContactSalesErrors>({})
  const [failed, setFailed] = useState<string | boolean>(false)
  const format = useMemo(() => ({ when: dateTimeFormat(locale, { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }), [locale])
  const update = <K extends 'name' | 'email' | 'company' | 'message'>(key: K, value: string) => {
    set(key, value)
    if (errors[key]) setErrors((all) => ({ ...all, [key]: undefined }))
  }

  const submit = async () => {
    setFailed(false)
    const found: ContactSalesErrors = {}
    if (!values.name.trim()) found.name = copy.nameMissing
    const email = values.email.trim()
    if (!email) found.email = copy.emailMissing
    else if (!/^\S+@\S+\.\S+$/.test(email)) found.email = copy.emailInvalid
    else if (requireWorkEmail && PERSONAL.test(email)) found.email = copy.emailPersonal
    if (!values.company.trim()) found.company = copy.companyMissing
    if (mode === 'message' && values.message.length > maxMessage) found.message = copy.messageTooLong(maxMessage)
    setErrors(found)
    const first = (['name', 'email', 'company', 'message'] as const).find((key) => found[key])
    if (first) {
      document.getElementById(`${base}-${first}`)?.focus()
      throw new Error(found[first])
    }
    try {
      await onSend({ ...values, mode, name: values.name.trim(), email, company: values.company.trim(), slot: mode === 'call' ? values.slot : null })
    } catch (cause) {
      setFailed(cause instanceof Error && cause.message ? cause.message : true)
      throw cause
    }
  }

  const slot = values.slot
  const contact = region?.contact
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-0.5">
        <Heading data-yj-step-heading tabIndex={-1} className="rounded-sm text-ui-lg font-semibold text-fg outline-none focus-ring">
          {mode === 'call' ? copy.detailsTitle : copy.messageTitle}
        </Heading>
        <p className="text-ui-sm text-fg-muted">{mode === 'call' ? copy.detailsDescription : copy.messageDescription}</p>
      </div>

      {mode === 'call' && slot ? (
        <Ticket
          start={slot.start}
          title={<span className="text-pretty text-ui font-medium text-fg">{format.when.format(new Date(slot.start))}</span>}
          line={contact && copy.withWhom(contact.name)}
          end={
            <Button variant="ghost" size="sm" className="shrink-0" onClick={onChangeTime}>
              {copy.change}
            </Button>
          }
          locale={locale}
        />
      ) : (
        region && <Person regions={regions} region={region} title={copy.replies(region.contact.name)} line={copy.meetRole(region.contact.role, region.contact.location)} onRegionChange={onRegionChange} copy={copy} />
      )}

      <form noValidate onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field invalid={!!errors.name}>
            <FieldLabel>{copy.name}</FieldLabel>
            <Input id={`${base}-name`} value={values.name} autoComplete="name" onChange={(e) => update('name', e.target.value)} />
            <FieldError>{errors.name}</FieldError>
          </Field>
          <Field invalid={!!errors.email}>
            <FieldLabel>{copy.email}</FieldLabel>
            <Input id={`${base}-email`} type="email" value={values.email} autoComplete="email" placeholder={copy.emailPlaceholder} onChange={(e) => update('email', e.target.value)} />
            <FieldError>{errors.email}</FieldError>
          </Field>
          <Field invalid={!!errors.company} className={sizes.length === 0 ? 'sm:col-span-2' : undefined}>
            <FieldLabel>{copy.company}</FieldLabel>
            <Input id={`${base}-company`} value={values.company} autoComplete="organization" onChange={(e) => update('company', e.target.value)} />
            <FieldError>{errors.company}</FieldError>
          </Field>
          {sizes.length > 0 && (
            <Field>
              <FieldLabel htmlFor={`${base}-size`}>{copy.size}</FieldLabel>
              <NativeSelect id={`${base}-size`} value={values.size} onChange={(e) => set('size', e.target.value)} className="w-full">
                {sizes.map((size) => (
                  <NativeSelectOption key={size} value={size}>
                    {size}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          )}
          {topics.length > 0 && (
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor={`${base}-topic`}>{copy.topic}</FieldLabel>
              <NativeSelect id={`${base}-topic`} value={values.topic} onChange={(e) => set('topic', e.target.value)} className="w-full">
                {topics.map((topic) => (
                  <NativeSelectOption key={topic} value={topic}>
                    {topic}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          )}
          {mode === 'message' && (
            <Field invalid={!!errors.message} className="sm:col-span-2">
              <FieldLabel>{copy.messageLabel}</FieldLabel>
              <Textarea id={`${base}-message`} value={values.message} rows={3} onChange={(e) => update('message', e.target.value)} />
              <FieldDescription>{copy.messageHint}</FieldDescription>
              <FieldError>{errors.message}</FieldError>
            </Field>
          )}
        </div>

        {failed && (
          <Alert variant="danger">
            <AlertTitle>{copy.failedTitle}</AlertTitle>
            <AlertDescription>{typeof failed === 'string' ? failed : copy.failedDescription}</AlertDescription>
          </Alert>
        )}
        <AsyncButton type="submit" size="lg" className="w-full" onAction={submit} pendingLabel={copy.pending} successLabel={copy.success} errorLabel={failed ? copy.failed : copy.invalid}>
          {mode === 'call' ? copy.submitCall : copy.submitMessage} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
        </AsyncButton>
        <p className="text-center text-ui-sm text-fg-muted">{copy.finePrint}</p>
      </form>

      {mode === 'message' && (
        <Button variant="ghost" className="self-center" onClick={onCall}>
          {copy.toCall}
        </Button>
      )}
    </div>
  )
}
