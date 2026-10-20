'use client'

import { useId, useState } from 'react'
import {
  AsyncButton,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  PasswordInput,
  PasswordRequirements,
  PasswordStrength,
  defaultPasswordRequirements,
} from '@youj/react'

export default function PasswordInputDemo() {
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const rulesId = useId()
  const allMet = defaultPasswordRequirements.every((rule) => rule.test(next))
  const mismatch = confirm.length > 0 && confirm !== next

  return (
    <Card className="w-full max-w-[420px]">
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>Stays signed in here.</CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel>Current password</FieldLabel>
            <PasswordInput defaultValue="hunter2hunter2" />
          </Field>
          <Field>
            <FieldLabel>New password</FieldLabel>
            <PasswordInput autoComplete="new-password" value={next} onValueChange={setNext} aria-describedby={rulesId} />
            <PasswordStrength value={next} />
            <PasswordRequirements id={rulesId} value={next} />
          </Field>
          <Field invalid={mismatch}>
            <FieldLabel>Confirm new password</FieldLabel>
            <PasswordInput autoComplete="new-password" value={confirm} onValueChange={setConfirm} />
            <FieldError>{mismatch ? 'Passwords don’t match yet.' : undefined}</FieldError>
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="justify-end">
        <AsyncButton
          disabled={!allMet || confirm !== next}
          onAction={() => new Promise((resolve) => setTimeout(resolve, 900))}
          pendingLabel="Updating…"
          successLabel="Password updated"
        >
          Update password
        </AsyncButton>
      </CardFooter>
    </Card>
  )
}
