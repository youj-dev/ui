'use client'

import { useState } from 'react'
import { useYouj } from '@youj/core'
import { UserPlusIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { demo, type SettingsCopy, type SettingsRole } from './data'

export interface InviteDialogProps {
  copy: SettingsCopy
  roles: SettingsRole[]
  workspace: string
  /** Sends the invite; resolve when it's sent, throw to show the error. Default: a demo wait. */
  onInvite?: (invite: { email: string; role: string }) => Promise<unknown> | unknown
  /** Called after a successful send, to add the row. */
  onInvited: (email: string, role: string) => void
}

export function InviteDialog({ copy, roles, workspace, onInvite, onInvited }: InviteDialogProps) {
  const k = useYouj()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(() => roles.find((r) => r.value === 'member')?.value ?? roles.find((r) => r.value !== 'owner')?.value ?? '')
  const [error, setError] = useState<string>()
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          setEmail('')
          setError(undefined)
        }
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <UserPlusIcon size={16} /> {copy.invite}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.inviteTitle}</DialogTitle>
          <DialogDescription>{copy.inviteDescription(workspace)}</DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-5">
          <Field invalid={!!error}>
            <FieldLabel>{copy.inviteEmail}</FieldLabel>
            <Input
              type="email"
              value={email}
              placeholder={copy.inviteEmailPlaceholder}
              onChange={(event) => {
                setEmail(event.target.value)
                setError(undefined)
              }}
            />
            <FieldError>{error}</FieldError>
          </Field>
          <Field>
            <FieldLabel>{copy.inviteRole}</FieldLabel>
            <Select items={roles} value={role} onValueChange={(value) => setRole(value as string)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.filter((r) => r.value !== 'owner').map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {copy.cancel}
          </Button>
          <AsyncButton
            pendingLabel={copy.sending}
            successLabel={copy.invited}
            errorLabel={copy.checkEmail}
            onAction={async () => {
              if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
                setError(copy.invalidEmail)
                throw new Error('invalid')
              }
              try {
                await (onInvite ? onInvite({ email: email.trim(), role }) : demo('Settings: onInvite', 800))
              } catch (failure) {
                if (failure instanceof Error && failure.message) setError(failure.message)
                throw failure
              }
              onInvited(email.trim(), role)
            }}
            onActionStateChange={(state) => {
              // Let "Invited" land, then close; the new row fades into the table.
              if (state === 'success') setTimeout(() => setOpen(false), k.ms('deliberate'))
            }}
          >
            {copy.sendInvite}
          </AsyncButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
