'use client'

import { useRef, useState } from 'react'
import { CheckIcon } from '@youj/icons'
import { ConfirmDialog } from '../../../components/ui/alert-dialog'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Field, FieldError, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { PasswordInput } from '../../../components/ui/password-input'
import { DEFAULT_COPY, USER, demo, type SettingsCopy, type SettingsUser } from './data'
import { Section } from './section'

export interface AccountTabProps {
  /** Default: the demo's strings. */
  copy?: SettingsCopy
  /** Default: the demo's user. */
  user?: SettingsUser
  onUpdatePassword?: (passwords: { current: string; next: string }) => Promise<unknown> | unknown
  onDeleteAccount?: () => Promise<unknown> | unknown
}

export function AccountTab({ copy = DEFAULT_COPY, user = USER, onUpdatePassword, onDeleteAccount }: AccountTabProps) {
  const [confirm, setConfirm] = useState(false)
  const [mismatch, setMismatch] = useState(false)
  const passwordForm = useRef<HTMLFormElement>(null)
  return (
    <div className="flex flex-col gap-4">
      <Section title={copy.emailTitle} description={copy.emailDescription}>
        <Field>
          <FieldLabel>{copy.emailLabel}</FieldLabel>
          <div className="flex flex-wrap items-center gap-2">
            <Input type="email" defaultValue={user.email} className="min-w-0 flex-1" />
            {user.verified && (
              <Badge variant="success">
                <CheckIcon size={12} strokeWidth={2.5} /> {copy.verified}
              </Badge>
            )}
          </div>
        </Field>
      </Section>
      <form ref={passwordForm} noValidate onSubmit={(event) => event.preventDefault()} onInput={() => setMismatch(false)}>
        <Section
          title={copy.passwordTitle}
          description={copy.passwordDescription}
          footer={
            <AsyncButton
              type="submit"
              pendingLabel={copy.updating}
              successLabel={copy.updated}
              errorLabel={copy.checkFields}
              onAction={async () => {
                const data = new FormData(passwordForm.current ?? undefined)
                if (!data.get('next') || data.get('next') !== data.get('confirm')) {
                  setMismatch(true)
                  throw new Error(copy.passwordMismatch)
                }
                const passwords = { current: String(data.get('current') ?? ''), next: String(data.get('next')) }
                await (onUpdatePassword ? onUpdatePassword(passwords) : demo('Settings: onUpdatePassword', 900))
                passwordForm.current?.reset()
              }}
            >
              {copy.updatePassword}
            </AsyncButton>
          }
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel>{copy.currentPassword}</FieldLabel>
              <PasswordInput name="current" />
            </Field>
            <Field>
              <FieldLabel>{copy.newPassword}</FieldLabel>
              <PasswordInput name="next" autoComplete="new-password" />
            </Field>
            <Field invalid={mismatch}>
              <FieldLabel>{copy.confirmPassword}</FieldLabel>
              <PasswordInput name="confirm" autoComplete="new-password" />
              <FieldError>{mismatch ? copy.passwordMismatch : undefined}</FieldError>
            </Field>
          </div>
        </Section>
      </form>
      <Card className="border-danger-line">
        <CardHeader>
          <CardTitle>{copy.deleteTitle}</CardTitle>
          <CardDescription>{copy.deleteDescription}</CardDescription>
          <CardAction>
            <Button variant="danger" onClick={() => setConfirm(true)}>
              {copy.deleteAccount}
            </Button>
          </CardAction>
        </CardHeader>
      </Card>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        destructive
        title={copy.deleteConfirmTitle}
        description={copy.deleteConfirmDescription}
        confirmLabel={copy.deleteConfirm}
        challenge={user.email}
        onConfirm={() => (onDeleteAccount ? onDeleteAccount() : demo('Settings: onDeleteAccount', 1200))}
      />
    </div>
  )
}
