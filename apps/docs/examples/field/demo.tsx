'use client'

import { useRef, useState, type FormEvent } from 'react'
import {
  Button,
  Checkbox,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  Input,
} from '@youj/react'

const SCOPES = [
  { id: 'read', label: 'Read', description: 'Projects, deployments and logs.' },
  { id: 'write', label: 'Write', description: 'Create deployments and change settings.' },
  { id: 'admin', label: 'Admin', description: 'Members, billing and deletion. Rarely needed.' },
]

export default function FieldDemo() {
  const name = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string>()
  const [created, setCreated] = useState('')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = name.current?.value.trim() ?? ''
    const problem = !value ? 'Give the token a name.' : value.length < 3 ? 'Use at least 3 characters.' : undefined
    setError(problem)
    if (problem) name.current?.focus()
    else setCreated(value)
  }

  return (
    <form noValidate onSubmit={submit} className="w-full max-w-md">
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Create an API token</FieldLegend>
          <FieldDescription>Tokens act as you. Give each one the least access it needs.</FieldDescription>
          {/* The error grows in below the input, and the fields beneath ease down to make room. */}
          <Field name="name" required invalid={!!error}>
            <FieldLabel>Token name</FieldLabel>
            <Input ref={name} placeholder="CI deploys" autoComplete="off" onValueChange={() => setError(undefined)} />
            <FieldError>{error}</FieldError>
            <FieldDescription>Only you see this.</FieldDescription>
          </Field>
        </FieldSet>
        <FieldSeparator />
        <FieldSet>
          <FieldLegend variant="label">Scopes</FieldLegend>
          <FieldGroup className="gap-3">
            {SCOPES.map((scope) => (
              <Field key={scope.id} name={`scope-${scope.id}`} orientation="horizontal">
                <Checkbox defaultChecked={scope.id === 'read'} />
                <FieldContent>
                  <FieldLabel>{scope.label}</FieldLabel>
                  <FieldDescription>{scope.description}</FieldDescription>
                </FieldContent>
              </Field>
            ))}
          </FieldGroup>
        </FieldSet>
        <div className="flex items-center justify-between gap-3">
          <p role="status" className="text-ui-sm text-fg-muted">
            {created && `Created “${created}”. Copy it now: it won’t be shown again.`}
          </p>
          <Button type="submit">Create token</Button>
        </div>
      </FieldGroup>
    </form>
  )
}
