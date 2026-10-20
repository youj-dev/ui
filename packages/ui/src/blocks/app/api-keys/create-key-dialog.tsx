'use client'

import { useState } from 'react'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { SegmentedControl, SegmentedControlItem } from '../../../components/ui/segmented-control'
import { demo, NEW_KEY_SCOPES, secret, type Access, type ApiKey, type ApiKeyDraft, type ApiKeyExpiry, type ApiKeysCopy, type Env, type Scopes } from './data'
import { SecretReveal } from './secret-reveal'

function ScopeMatrix({ value, onChange, resources, copy }: { value: Scopes; onChange: (next: Scopes) => void; resources: string[]; copy: ApiKeysCopy }) {
  return (
    <FieldSet>
      <FieldLegend variant="label">{copy.permissions}</FieldLegend>
      <FieldDescription>{copy.permissionsDescription}</FieldDescription>
      <div role="group" aria-label={copy.permissionsGroup} className="divide-y divide-line-subtle overflow-hidden rounded-lg bg-band">
        {resources.map((r) => (
          <div key={r} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="text-ui text-fg">{r}</span>
            <SegmentedControl
              variant="pill"
              size="sm"
              aria-label={copy.resourceAccess(r)}
              value={value[r] ?? 'none'}
              onValueChange={(next) => onChange({ ...value, [r]: next as Access })}
              className="w-44"
            >
              <SegmentedControlItem value="none">{copy.none}</SegmentedControlItem>
              <SegmentedControlItem value="read">{copy.read}</SegmentedControlItem>
              <SegmentedControlItem value="write">{copy.write}</SegmentedControlItem>
            </SegmentedControl>
          </div>
        ))}
      </div>
    </FieldSet>
  )
}

export function CreateKeyDialog({
  env,
  open,
  onOpenChange,
  onCreate,
  product,
  copy,
  resources,
  expiries,
  mint,
}: {
  env: Env
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (key: ApiKey) => void
  product: string
  copy: ApiKeysCopy
  resources: string[]
  expiries: ApiKeyExpiry[]
  /** Creates the key and returns its secret. */
  mint?: (draft: ApiKeyDraft) => Promise<string> | string
}) {
  const fresh = (): Scopes => Object.fromEntries(resources.map((r) => [r, NEW_KEY_SCOPES[r] ?? 'none']))
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<Scopes>(fresh)
  const [expires, setExpires] = useState('90d')
  const [error, setError] = useState<string>()
  const [failure, setFailure] = useState<string>()
  const [created, setCreated] = useState<{ key: ApiKey; secret: string }>()

  const reset = () => {
    setName('')
    setError(undefined)
    setFailure(undefined)
    setCreated(undefined)
    setScopes(fresh())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} onOpenChangeComplete={(next) => !next && reset()}>
      <DialogContent className="max-w-md" showCloseButton={!created}>
        <DialogHeader>
          <DialogTitle>{created ? copy.ready(created.key.name) : copy.newKey(env)}</DialogTitle>
          <DialogDescription>
            {created ? copy.readyDescription : copy.newKeyDescription(product)}
          </DialogDescription>
        </DialogHeader>
        {created ? (
          <SecretReveal
            product={product}
            copy={copy}
            value={created.secret}
            onDone={() => {
              onCreate(created.key)
              onOpenChange(false)
            }}
          />
        ) : (
          <>
            <FieldGroup className="gap-5">
              <Field invalid={!!error}>
                <FieldLabel>{copy.name}</FieldLabel>
                <Input
                  value={name}
                  placeholder={copy.namePlaceholder}
                  onChange={(event) => {
                    setName(event.target.value)
                    setError(undefined)
                  }}
                />
                <FieldError>{error}</FieldError>
              </Field>
              <ScopeMatrix value={scopes} onChange={setScopes} resources={resources} copy={copy} />
              <Field>
                <FieldLabel>{copy.expires}</FieldLabel>
                <Select items={expiries} value={expires} onValueChange={(value) => setExpires(value as string)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expiries.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>
            {failure && (
              <p role="alert" className="text-ui-sm text-danger-text">
                {failure}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {copy.cancel}
              </Button>
              <AsyncButton
                pendingLabel={copy.minting}
                successLabel={copy.created}
                onClick={(event) => {
                  // Validate before the action runs, so a corrected form can be sent straight away.
                  const problem = !name.trim() ? copy.nameRequired : resources.every((r) => (scopes[r] ?? 'none') === 'none') ? copy.permissionRequired : undefined
                  if (problem) {
                    setError(problem)
                    event.preventDefault()
                  }
                }}
                onAction={async () => {
                  const draft = { name: name.trim(), env, scopes, expires }
                  setFailure(undefined)
                  let value: string
                  try {
                    value = mint ? await mint(draft) : (await demo('ApiKeys: onCreate', 700), secret())
                  } catch (failed) {
                    setFailure(failed instanceof Error && failed.message ? failed.message : copy.failed)
                    throw failed
                  }
                  setCreated({
                    secret: value,
                    key: { ...draft, id: `k${Date.now()}`, last4: value.slice(-4), createdBy: copy.you, lastUsed: null, traffic: [0, 0, 0, 0, 0, 0, 0] },
                  })
                }}
              >
                {copy.createKey}
              </AsyncButton>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
