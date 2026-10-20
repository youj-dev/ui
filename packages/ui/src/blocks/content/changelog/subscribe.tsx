'use client'

import { useState } from 'react'
import { BellIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Field, FieldError, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '../../../components/ui/popover'
import type { ChangelogCopy } from './data'

/** Subscribe by email from a Popover; the save runs through Button's onAction and a rejection's message shows under the field. */
function Subscribe({ copy, onSubscribe }: { copy: ChangelogCopy; onSubscribe: (email: string) => Promise<unknown> | unknown }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <BellIcon size={14} /> {copy.subscribe}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>{copy.subscribeTitle}</PopoverTitle>
          <PopoverDescription>{copy.subscribeDescription}</PopoverDescription>
        </PopoverHeader>
        <Field invalid={!!error}>
          <FieldLabel>{copy.email}</FieldLabel>
          <Input
            type="email"
            value={email}
            placeholder={copy.emailPlaceholder}
            onChange={(event) => {
              setEmail(event.target.value)
              setError(undefined)
            }}
          />
          <FieldError>{error}</FieldError>
        </Field>
        <AsyncButton
          pendingLabel={copy.subscribing}
          successLabel={copy.subscribed}
          errorLabel={copy.subscribeError}
          onAction={async () => {
            if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
              setError(copy.emailInvalid)
              throw new Error('invalid')
            }
            try {
              await onSubscribe(email.trim())
            } catch (reason) {
              setError(reason instanceof Error ? reason.message : copy.subscribeError)
              throw reason
            }
          }}
        >
          {copy.subscribe}
        </AsyncButton>
      </PopoverContent>
    </Popover>
  )
}

export { Subscribe }
