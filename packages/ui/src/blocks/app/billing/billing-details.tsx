'use client'

import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { demo, type BillingCopy, type BillingInfo as Details } from './data'

/** Who invoices are addressed and sent to. Save arms once something changes. */
export function BillingDetails({
  details,
  copy,
  onSaveDetails,
  onSaved,
}: {
  details: Details
  copy: BillingCopy
  /** Saves the details; resolve when saved, throw to show the error. Default: a demo wait. */
  onSaveDetails?: (details: Details) => Promise<unknown> | unknown
  onSaved: () => void
}) {
  const [saved, setSaved] = useState<Details>(details)
  const [form, setForm] = useState<Details>(details)
  const [failure, setFailure] = useState<string>()
  const [error, setError] = useState<string>()
  const dirty = (Object.keys(form) as (keyof Details)[]).some((key) => form[key] !== saved[key])
  const set = (key: keyof Details) => (event: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [key]: event.target.value }))
    if (key === 'email') setError(undefined)
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.detailsTitle}</CardTitle>
        <CardDescription>{copy.detailsDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Fields stop at a readable width when the card spans the page (a single column). */}
        <FieldGroup className="max-w-xl gap-4">
          <Field>
            <FieldLabel>{copy.company}</FieldLabel>
            <Input autoComplete="organization" value={form.company} onChange={set('company')} />
          </Field>
          <Field invalid={!!error}>
            <FieldLabel>{copy.invoiceEmail}</FieldLabel>
            <Input type="email" autoComplete="email" value={form.email} onChange={set('email')} />
            <FieldError>{error}</FieldError>
          </Field>
          <Field>
            <FieldLabel>{copy.address}</FieldLabel>
            <Textarea rows={2} autoComplete="street-address" value={form.address} onChange={set('address')} />
          </Field>
          <Field>
            <FieldLabel>{copy.taxId}</FieldLabel>
            <Input value={form.taxId} onChange={set('taxId')} className="tabular-nums" />
          </Field>
        </FieldGroup>
        {failure && (
          <p role="alert" className="mt-4 text-ui-sm text-danger-text">
            {failure}
          </p>
        )}
      </CardContent>
      <CardFooter className="justify-end gap-2 border-t border-line">
        <Button variant="ghost" size="sm" disabled={!dirty} onClick={() => setForm(saved)}>
          {copy.reset}
        </Button>
        <AsyncButton
          size="sm"
          disabled={!dirty}
          pendingLabel={copy.saving}
          successLabel={copy.saved}
          onClick={(event) => {
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return
            setError(copy.emailError)
            event.preventDefault()
          }}
          onAction={async () => {
            setFailure(undefined)
            try {
              await (onSaveDetails ? onSaveDetails(form) : demo('Billing: onSaveDetails', 700))
            } catch (error) {
              if (error instanceof Error && error.message) setFailure(error.message)
              throw error
            }
            setSaved(form)
            onSaved()
          }}
        >
          {copy.saveDetails}
        </AsyncButton>
      </CardFooter>
    </Card>
  )
}
