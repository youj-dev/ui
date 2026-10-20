'use client'

import { useState } from 'react'
import { Button, Field, FieldDescription, FieldError, FieldLabel, Textarea } from '@youj/react'

const LIMIT = 280

export default function TextareaDemo() {
  const [value, setValue] = useState('')
  const [sent, setSent] = useState(false)
  const left = LIMIT - value.length

  return (
    <form
      className="w-full max-w-md"
      onSubmit={(event) => {
        event.preventDefault()
        setSent(true)
        setValue('')
      }}
    >
      <Field invalid={left < 0}>
        <FieldLabel>What could be better?</FieldLabel>
        <Textarea
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setSent(false)
          }}
          placeholder="The more specific, the more useful."
        />
        <div className="flex items-start justify-between gap-3">
          {left < 0 ? (
            <FieldError>{`${-left} characters over the limit.`}</FieldError>
          ) : (
            <FieldDescription>Goes straight to the team that owns it.</FieldDescription>
          )}
          {/* The count updates silently. Only the last 20 characters are announced. */}
          <span aria-hidden className="shrink-0 font-mono text-ui-xs text-fg-muted tabular-nums">
            {left}
          </span>
        </div>
        <span aria-live="polite" className="sr-only">
          {left >= 0 && left <= 20 ? `${left} characters left` : ''}
        </span>
      </Field>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p role="status" className="text-ui-sm text-fg-muted">
          {sent && 'Thanks. The team reads every one.'}
        </p>
        <Button type="submit" disabled={left < 0 || value.trim() === ''}>
          Send feedback
        </Button>
      </div>
    </form>
  )
}
