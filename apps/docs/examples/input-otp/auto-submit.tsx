'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldLabel, InputOTP } from '@youj/react'

export default function InputOTPAutoSubmit() {
  const [submitted, setSubmitted] = useState<string | null>(null)

  return (
    <form
      className="flex w-fit flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        setSubmitted(String(new FormData(event.currentTarget).get('code')))
      }}
    >
      <Field>
        <FieldLabel>Email code</FieldLabel>
        <InputOTP name="code" autoSubmit />
        <FieldDescription>The form submits itself as soon as the last digit lands.</FieldDescription>
      </Field>
      <p role="status" className="text-ui-sm text-fg-muted">
        {submitted ? `Submitted ${submitted}` : ''}
      </p>
    </form>
  )
}
