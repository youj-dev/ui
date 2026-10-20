'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, Input } from '@youj/react'

const TAKEN = ['youj', 'admin', 'docs', 'status']

function passwordErrors(value: string) {
  const errors: { message: string }[] = []
  if (value.length < 12) errors.push({ message: 'Use at least 12 characters.' })
  if (!/[\d\W_]/.test(value)) errors.push({ message: 'Include a number or a symbol.' })
  return errors
}

export default function FieldValidation() {
  const [handle, setHandle] = useState('youj')
  const [password, setPassword] = useState('')
  const taken = TAKEN.includes(handle.trim().toLowerCase())
  const problems = password ? passwordErrors(password) : []

  return (
    <FieldGroup className="w-full max-w-sm">
      <Field invalid={taken}>
        <FieldLabel>Team handle</FieldLabel>
        <Input value={handle} onValueChange={setHandle} autoComplete="off" spellCheck={false} />
        {/* Children in, message shown; undefined, message gone. It collapses over its last text. */}
        <FieldError>{taken ? `@${handle.trim()} is taken. Try another.` : undefined}</FieldError>
        <FieldDescription>Used in URLs: youj.io/@{handle.trim() || 'handle'}</FieldDescription>
      </Field>
      <Field invalid={problems.length > 0}>
        <FieldLabel>New password</FieldLabel>
        <Input type="password" value={password} onValueChange={setPassword} autoComplete="new-password" />
        {/* Several problems become a list; duplicates collapse. */}
        <FieldError errors={problems} />
      </Field>
      <Field disabled>
        <FieldLabel>Region</FieldLabel>
        <Input defaultValue="Frankfurt, eu-central-1" />
        <FieldDescription>Set when the team was created.</FieldDescription>
      </Field>
    </FieldGroup>
  )
}
