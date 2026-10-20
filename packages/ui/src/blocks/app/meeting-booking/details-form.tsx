'use client'

import { useState } from 'react'
import { AsyncButton } from '../../../components/ui/async-button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import type { BookingCopy } from './data'

interface BookingDetails {
  name: string
  email: string
  notes: string
}

/** The visitor's name, email and notes, checked on submit; `onBook` runs once they pass. */
function DetailsForm({
  copy,
  host,
  onBook,
  onBooked,
}: {
  copy: BookingCopy
  /** The host's first name, for the questions. */
  host: string
  onBook: (details: BookingDetails) => Promise<unknown> | unknown
  onBooked: (details: BookingDetails) => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  // Why the last booking failed, from the rejection.
  const [failed, setFailed] = useState<string>()
  const details = { name: name.trim(), email: email.trim(), notes: notes.trim() }

  return (
    <form noValidate onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5">
      <FieldGroup className="gap-5">
        <Field invalid={!!errors.name}>
          <FieldLabel>{copy.name}</FieldLabel>
          <Input value={name} autoComplete="name" onChange={(e) => (setName(e.target.value), setErrors((x) => ({ ...x, name: undefined })))} />
          <FieldError>{errors.name}</FieldError>
        </Field>
        <Field invalid={!!errors.email}>
          <FieldLabel>{copy.email}</FieldLabel>
          <Input
            type="email"
            value={email}
            autoComplete="email"
            placeholder={copy.emailPlaceholder}
            onChange={(e) => (setEmail(e.target.value), setErrors((x) => ({ ...x, email: undefined })))}
          />
          <FieldError>{errors.email}</FieldError>
        </Field>
        <Field>
          <FieldLabel>{copy.notes(host)}</FieldLabel>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={copy.notesPlaceholder} />
          <FieldDescription>{copy.notesHint(host)}</FieldDescription>
        </Field>
      </FieldGroup>
      <AsyncButton
        type="submit"
        size="lg"
        pendingLabel={copy.booking}
        successLabel={copy.booked}
        errorLabel={copy.checkDetails}
        onAction={async () => {
          const next = {
            name: details.name ? undefined : copy.nameRequired(host),
            email: /^\S+@\S+\.\S+$/.test(details.email) ? undefined : copy.emailInvalid,
          }
          setErrors(next)
          setFailed(undefined)
          if (next.name || next.email) throw new Error('invalid')
          try {
            await onBook(details)
          } catch (reason) {
            setFailed(reason instanceof Error && reason.message ? reason.message : copy.bookFailed)
            throw reason
          }
        }}
        onActionStateChange={(s) => s === 'success' && onBooked(details)}
      >
        {copy.confirm}
      </AsyncButton>
      {failed && (
        <p role="alert" className="text-ui-sm text-danger-text">
          {failed}
        </p>
      )}
    </form>
  )
}

export { DetailsForm, type BookingDetails }
