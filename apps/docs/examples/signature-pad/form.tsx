'use client'

import { useState, type FormEvent } from 'react'
import { Button, Field, FieldDescription, FieldError, FieldLabel, Input, SignaturePad } from '@youj/react'

export default function SignaturePadForm() {
  const [sent, setSent] = useState('')

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setSent(`${data.get('name')}: ${String(data.get('signature')).slice(0, 28)}…`)
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-lg flex-col gap-4">
      <Field>
        <FieldLabel>Full name</FieldLabel>
        <Input name="name" defaultValue="Dana Whitfield" />
      </Field>
      <Field required>
        <FieldLabel>Signature</FieldLabel>
        <SignaturePad className="border-0 shadow-none [--signature-inset:0px]" name="signature" />
        <FieldDescription>Accept your signature; it is sent with the form as a PNG.</FieldDescription>
        <FieldError match="valueMissing">Sign and accept before you submit.</FieldError>
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit">Submit</Button>
        {sent && (
          <span role="status" className="truncate font-mono text-ui-xs text-fg-muted">
            {sent}
          </span>
        )}
      </div>
    </form>
  )
}
