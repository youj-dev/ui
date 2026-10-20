'use client'

import { useState, type MouseEvent } from 'react'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldTitle } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '../../../components/ui/sheet'
import { Switch } from '../../../components/ui/switch'
import { checkUrl, newSecret, type Endpoint, type WebhooksCopy } from './data'
import { EventPicker } from './event-picker'
import { SigningSecret } from './signing-secret'

function EndpointForm({ endpoint, taken, copy, onSave, onRotateSecret, onClose }: { endpoint?: Endpoint; taken: string[]; copy: WebhooksCopy; onSave: (endpoint: Endpoint) => Promise<unknown> | unknown; onRotateSecret: (endpoint: Endpoint) => Promise<unknown> | unknown; onClose: () => void }) {
  const [url, setUrl] = useState(endpoint?.url ?? '')
  const [description, setDescription] = useState(endpoint?.description ?? '')
  const [events, setEvents] = useState<string[]>(endpoint?.events ?? [])
  const [enabled, setEnabled] = useState(endpoint?.enabled ?? true)
  const [secret, setSecret] = useState(endpoint?.secret ?? '')
  // Errors show once the field is left or the form is sent, then follow each keystroke.
  const [touched, setTouched] = useState({ url: false, events: false })
  const urlError = touched.url ? checkUrl(url, copy, taken) : undefined
  const eventsError = touched.events && !events.length ? copy.eventsRequired : undefined

  const guard = (event: MouseEvent) => {
    setTouched({ url: true, events: true })
    if (checkUrl(url, copy, taken) || !events.length) event.preventDefault()
  }

  return (
    <>
      <SheetBody className="flex flex-col gap-6">
        <FieldGroup className="gap-5">
          <Field invalid={!!urlError} required>
            <FieldLabel>{copy.url}</FieldLabel>
            <Input
              dir="ltr"
              type="url"
              inputMode="url"
              spellCheck={false}
              autoComplete="off"
              value={url}
              placeholder={copy.urlPlaceholder}
              className="font-mono text-ui-sm"
              onChange={(event) => setUrl(event.target.value)}
              onBlur={() => url && setTouched((t) => ({ ...t, url: true }))}
            />
            <FieldError>{urlError}</FieldError>
          </Field>
          <Field>
            <FieldLabel>{copy.endpointDescription}</FieldLabel>
            <Input value={description} placeholder={copy.endpointDescriptionPlaceholder} onChange={(event) => setDescription(event.target.value)} />
          </Field>
          <EventPicker value={events} onChange={setEvents} error={eventsError} copy={copy} />
          {endpoint && (
            <>
              <SigningSecret secret={secret} rotate={() => onRotateSecret(endpoint!)} onRotate={setSecret} copy={copy} />
              <FieldLabel>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>{copy.active}</FieldTitle>
                    <FieldDescription>{copy.activeHint}</FieldDescription>
                  </FieldContent>
                  <Switch checked={enabled} onCheckedChange={setEnabled} />
                </Field>
              </FieldLabel>
            </>
          )}
        </FieldGroup>
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" onClick={onClose}>
          {copy.cancel}
        </Button>
        <AsyncButton
          pendingLabel={copy.saving}
          successLabel={copy.saved}
          onClick={guard}
          onAction={async () => {
            await onSave({ id: endpoint?.id ?? `we_${Date.now()}`, url: url.trim(), description: description.trim(), events, enabled, secret: secret || newSecret() })
            onClose()
          }}
        >
          {copy.save}
        </AsyncButton>
      </SheetFooter>
    </>
  )
}

export function EndpointSheet({
  open,
  endpoint,
  taken,
  copy,
  onOpenChange,
  onSave,
  onRotateSecret,
}: {
  open: boolean
  /** The endpoint being edited; none to add one. */
  endpoint?: Endpoint
  /** URLs other endpoints use. */
  taken: string[]
  copy: WebhooksCopy
  onOpenChange: (open: boolean) => void
  /** Saves the endpoint; the sheet closes once it resolves. */
  onSave: (endpoint: Endpoint) => Promise<unknown> | unknown
  /** Rotates the edited endpoint's secret; a string it resolves to is the new secret. */
  onRotateSecret: (endpoint: Endpoint) => Promise<unknown> | unknown
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="end" className="w-[min(--spacing(128),calc(100vw-1rem))] sm:max-w-none">
        <SheetHeader>
          <SheetTitle>{endpoint ? copy.editTitle : copy.addTitle}</SheetTitle>
          <SheetDescription>{copy.sheetDescription}</SheetDescription>
        </SheetHeader>
        {/* Keyed so each opening starts from the endpoint as saved. */}
        <EndpointForm key={endpoint?.id ?? 'new'} endpoint={endpoint} taken={taken} copy={copy} onSave={onSave} onRotateSecret={onRotateSecret} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}
