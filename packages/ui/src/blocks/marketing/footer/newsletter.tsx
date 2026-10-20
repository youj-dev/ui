'use client'

import { useState } from 'react'
import { AsyncButton } from '../../../components/ui/async-button'
import { Field, FieldDescription, FieldError, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import type { MarketingFooterCopy } from './data'

/* The sign-up: one Input and a Button whose onAction carries the request
 * (spinner, then a drawn check and "Subscribed", or a shake and the reason
 * under the field). Once subscribed the hint becomes a note, spoken politely. */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function Newsletter({ onSubscribe, copy }: { onSubscribe: (email: string) => Promise<unknown> | unknown; copy: MarketingFooterCopy }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const subscribe = async () => {
    setError(null)
    setDone(false)
    if (!EMAIL.test(email.trim())) {
      setError(copy.invalidEmail)
      throw new Error('invalid')
    }
    try {
      await onSubscribe(email.trim())
      setEmail('')
      setDone(true)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : copy.subscribeFailed)
      throw failure
    }
  }

  return (
    <form noValidate aria-label={copy.newsletter} onSubmit={(event) => event.preventDefault()} className="flex max-w-sm flex-col gap-2">
      <Field invalid={error !== null}>
        <FieldLabel>{copy.subscribeLabel}</FieldLabel>
        <div className="flex gap-2">
          <Input
            type="email"
            autoComplete="email"
            placeholder={copy.placeholder}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError(null)
            }}
            className="min-w-0 flex-1"
          />
          <AsyncButton type="submit" onAction={subscribe} pendingLabel={copy.subscribing} successLabel={copy.subscribed} errorLabel={copy.retry}>
            {copy.subscribe}
          </AsyncButton>
        </div>
        {error ? <FieldError>{error}</FieldError> : <FieldDescription>{done && copy.subscribedNote ? copy.subscribedNote : copy.subscribeHint}</FieldDescription>}
      </Field>
      <p role="status" className="sr-only">
        {done ? copy.subscribedNote : ''}
      </p>
    </form>
  )
}
