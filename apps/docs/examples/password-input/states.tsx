'use client'

import { Field, FieldError, FieldLabel, PasswordInput } from '@youj/react'

export default function PasswordInputStates() {
  return (
    <div className="grid w-full max-w-lg gap-6 sm:grid-cols-2">
      <Field>
        <FieldLabel>Revealed</FieldLabel>
        <PasswordInput defaultValue="correct horse" defaultVisible />
      </Field>
      <Field invalid>
        <FieldLabel>Password</FieldLabel>
        <PasswordInput defaultValue="nope" />
        <FieldError>That password is incorrect.</FieldError>
      </Field>
      <Field disabled>
        <FieldLabel>Disabled</FieldLabel>
        <PasswordInput defaultValue="secret" />
      </Field>
    </div>
  )
}
