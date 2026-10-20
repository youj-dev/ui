'use client'

import { useState, type FormEvent } from 'react'
import { Button, Field, FieldDescription, FieldError, FieldLabel, Input } from '@youj/react'
import { SendIcon } from '@youj/icons'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function InputDemo() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState('')

  function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!EMAIL.test(email.trim())) {
      setError('Enter an email address like name@company.com.')
      return
    }
    setSent(email.trim())
    setEmail('')
  }

  return (
    <form noValidate onSubmit={invite} className="w-full max-w-md">
      <Field invalid={!!error}>
        <FieldLabel>Invite by email</FieldLabel>
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onValueChange={(value) => {
              setEmail(value)
              setError(undefined)
            }}
            placeholder="teammate@company.com"
            autoComplete="off"
          />
          <Button type="submit" className="shrink-0">
            <SendIcon />
            Send invite
          </Button>
        </div>
        <FieldError>{error}</FieldError>
        <FieldDescription>They join as a member. You can change roles later.</FieldDescription>
      </Field>
      <p role="status" className="mt-3 text-ui-sm text-fg-muted">
        {sent && `Invite sent to ${sent}.`}
      </p>
    </form>
  )
}
