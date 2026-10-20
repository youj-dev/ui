'use client'

import { useState, type FormEvent, type MouseEvent } from 'react'
import { AsyncButton } from '../../../components/ui/async-button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { PasswordInput } from '../../../components/ui/password-input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import type { AcceptInviteCopy, AcceptInviteDetails } from './data'

type Mode = AcceptInviteDetails['mode']

/** Sign in or create an account, then join: two tabs over one submit each. */
export function JoinForm({
  email,
  defaultMode,
  copy,
  onJoin,
  onJoined,
}: {
  email: string
  defaultMode: Mode
  copy: AcceptInviteCopy
  onJoin: (details: AcceptInviteDetails) => unknown
  onJoined: () => void
}) {
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [tried, setTried] = useState(false)
  const creating = mode === 'create'
  const passwordError = !tried ? undefined : !password ? copy.passwordRequired : creating && password.length < 8 ? copy.passwordTooShort : undefined
  const nameError = tried && creating && !name.trim() ? copy.nameRequired : undefined

  // Validate before the action runs, so a corrected form can be sent straight away.
  const guard = (event: MouseEvent) => {
    setTried(true)
    if (!password || (creating && (password.length < 8 || !name.trim()))) event.preventDefault()
  }
  const submit = (
    <AsyncButton
      type="submit"
      size="lg"
      className="w-full"
      pendingLabel={copy.joining}
      errorLabel={copy.joinFailed}
      onClick={guard}
      onAction={() => onJoin({ mode, email, password, ...(creating && { name: name.trim() }) })}
      onActionStateChange={(state) => state === 'success' && onJoined()}
    >
      {creating ? copy.createAndJoin : copy.signInAndJoin}
    </AsyncButton>
  )
  const emailField = (
    <Field>
      <FieldLabel>{copy.email}</FieldLabel>
      <Input value={email} readOnly autoComplete="username" dir="ltr" className="text-fg-muted" />
    </Field>
  )

  return (
    <Tabs
      value={mode}
      onValueChange={(next) => {
        setMode(next as Mode)
        setTried(false)
      }}
      className="gap-4"
    >
      <TabsList variant="pill" aria-label={copy.choice} className="w-full *:flex-1">
        <TabsTrigger value="sign-in">{copy.signInTab}</TabsTrigger>
        <TabsTrigger value="create">{copy.createTab}</TabsTrigger>
      </TabsList>
      <form noValidate onSubmit={(event: FormEvent) => event.preventDefault()}>
        <TabsContent value="sign-in">
          <FieldGroup className="gap-4">
            {emailField}
            <Field invalid={!!passwordError}>
              <FieldLabel>{copy.password}</FieldLabel>
              <PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
              <FieldError>{passwordError}</FieldError>
            </Field>
            {submit}
          </FieldGroup>
        </TabsContent>
        <TabsContent value="create">
          <FieldGroup className="gap-4">
            <Field invalid={!!nameError}>
              <FieldLabel>{copy.fullName}</FieldLabel>
              <Input value={name} placeholder={copy.fullNamePlaceholder} autoComplete="name" onChange={(event) => setName(event.target.value)} />
              <FieldError>{nameError}</FieldError>
            </Field>
            {emailField}
            <Field invalid={!!passwordError}>
              <FieldLabel>{copy.newPassword}</FieldLabel>
              <PasswordInput value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
              {passwordError ? <FieldError>{passwordError}</FieldError> : <FieldDescription>{copy.newPasswordHint}</FieldDescription>}
            </Field>
            {submit}
          </FieldGroup>
        </TabsContent>
      </form>
    </Tabs>
  )
}
