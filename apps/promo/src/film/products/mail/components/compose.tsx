'use client'

import { useState } from 'react'
import { SendIcon } from '@youj/icons'
import { Button } from '@youj/react/components/ui/button'
import { AsyncButton } from '@youj/react/components/ui/async-button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@youj/react/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@youj/react/components/ui/field'
import { Input } from '@youj/react/components/ui/input'
import { Kbd } from '@youj/react/components/ui/kbd'
import { TagInput } from '@youj/react/components/ui/tag-input'
import { Textarea } from '@youj/react/components/ui/textarea'
import { ME } from '../data'
import type { Draft } from '../use-folio'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** A new letter: recipients are tags, each checked as it's added; sending needs one, and runs through sending to sent. */
export function Compose({ open, onOpenChange, draft, onSend }: { open: boolean; onOpenChange: (open: boolean) => void; draft: Draft; onSend: (draft: Draft) => Promise<void> }) {
  const [to, setTo] = useState(draft.to)
  const [subject, setSubject] = useState(draft.subject)
  const [body, setBody] = useState(draft.body)
  const [error, setError] = useState<string | null>(null)
  const [seen, setSeen] = useState({ open, draft })
  if (seen.open !== open || seen.draft !== draft) {
    setSeen({ open, draft })
    if (open) {
      setTo(draft.to)
      setSubject(draft.subject)
      setBody(draft.body)
      setError(null)
    }
  }

  const send = async () => {
    if (!to.length) {
      setError('Add at least one recipient.')
      throw new Error('no recipients')
    }
    setError(null)
    await onSend({ to, subject, body })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl">New letter</DialogTitle>
          <DialogDescription>
            From {ME.name}. Press <Kbd>⌘</Kbd> <Kbd>Enter</Kbd> to send.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          aria-label="Compose"
          onSubmit={(event) => event.preventDefault()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) event.currentTarget.querySelector<HTMLButtonElement>('button[type=submit]')?.click()
          }}
        >
          <FieldGroup>
            <Field invalid={error !== null}>
              <FieldLabel>To</FieldLabel>
              <TagInput
                value={to}
                onValueChange={(next) => {
                  setTo(next)
                  if (next.length) setError(null)
                }}
                delimiters={[',', ' ', ';']}
                addOnBlur
                validate={(tag) => (EMAIL.test(tag) ? null : `${tag} isn’t an email address.`)}
                placeholder="name@studio.com"
              />
              <FieldError>{error}</FieldError>
            </Field>
            <Field>
              <FieldLabel>Subject</FieldLabel>
              <Input value={subject} onChange={(event) => setSubject(event.target.value)} />
            </Field>
            <Field>
              <FieldLabel>Letter</FieldLabel>
              <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={8} className="text-base leading-relaxed" />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <DialogClose render={<Button variant="ghost" />}>Discard</DialogClose>
            <AsyncButton type="submit" pendingLabel="Sending…" successLabel="Sent" errorLabel="Can’t send yet" onAction={send} data-yj-trigger="">
              <SendIcon size={16} /> Send
            </AsyncButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
