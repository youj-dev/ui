'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldError, FieldLabel, PhoneInput, type PhoneInputChange } from '@youj/react'

export default function PhoneInputDemo() {
  const [value, setValue] = useState('+14155550123')
  const [details, setDetails] = useState<PhoneInputChange | null>(null)
  const [touched, setTouched] = useState(false)
  const incomplete = touched && !!value && details?.complete === false

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <Field invalid={incomplete} onBlur={() => setTouched(true)}>
        <FieldLabel>Mobile number</FieldLabel>
        <PhoneInput
          value={value}
          onValueChange={(next, change) => {
            setValue(next)
            setDetails(change)
          }}
        />
        <FieldError>{incomplete ? `That’s short for a ${details!.country.name} number.` : undefined}</FieldError>
        <FieldDescription>We’ll text a code to confirm it. Paste +44 20 7946 0958 to switch country.</FieldDescription>
      </Field>
      <code className="font-mono text-ui-sm text-fg-muted">value: {value || '""'}</code>
    </div>
  )
}
