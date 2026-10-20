'use client'

import { useRef } from 'react'
import { AvatarUpload } from '../../../components/ui/avatar-upload'
import { AsyncButton } from '../../../components/ui/async-button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '../../../components/ui/input-group'
import { Textarea } from '../../../components/ui/textarea'
import { DEFAULT_COPY, initials, USER, demo, type SettingsCopy, type SettingsProfile, type SettingsUser } from './data'
import { Section } from './section'

export interface ProfileTabProps {
  /** Default: the demo's strings. */
  copy?: SettingsCopy
  /** Default: the demo's user. */
  user?: SettingsUser
  onSaveProfile?: (profile: SettingsProfile) => Promise<unknown> | unknown
  onSaveAvatar?: (file: File) => Promise<unknown> | unknown
  onRemoveAvatar?: () => Promise<unknown> | unknown
}

export function ProfileTab({ copy = DEFAULT_COPY, user = USER, onSaveProfile, onSaveAvatar, onRemoveAvatar }: ProfileTabProps) {
  const form = useRef<HTMLFormElement>(null)
  const save = () => {
    const data = new FormData(form.current ?? undefined)
    const profile = { name: String(data.get('name') ?? ''), username: String(data.get('username') ?? ''), bio: String(data.get('bio') ?? '') }
    return onSaveProfile ? onSaveProfile(profile) : demo('Settings: onSaveProfile', 900)
  }
  return (
    <form ref={form} noValidate onSubmit={(event) => event.preventDefault()}>
      <Section
        title={copy.profileTitle}
        description={copy.profileDescription}
        footer={
          <AsyncButton type="submit" onAction={save} pendingLabel={copy.saving} successLabel={copy.saved}>
            {copy.saveProfile}
          </AsyncButton>
        }
      >
        <FieldGroup>
          <Field>
            <FieldLabel>{copy.photo}</FieldLabel>
            <AvatarUpload
              name={user.name}
              src={user.avatarUrl}
              fallback={initials(user.name)}
              onSave={(file) => (onSaveAvatar ? onSaveAvatar(file) : demo('Settings: onSaveAvatar', 900))}
              onRemove={() => (onRemoveAvatar ? onRemoveAvatar() : demo('Settings: onRemoveAvatar', 400))}
            />
          </Field>
          <div className="grid gap-x-6 gap-y-[calc(var(--spacing)*(6_-_2*var(--ui--compact,0)))] sm:grid-cols-2">
            <Field>
              <FieldLabel>{copy.name}</FieldLabel>
              <Input name="name" defaultValue={user.name} autoComplete="name" />
            </Field>
            <Field>
              <FieldLabel>{copy.username}</FieldLabel>
              {/* A URL reads left to right in every script, so the prefix stays before the name under RTL. */}
              <InputGroup dir="ltr">
                <InputGroupAddon>
                  <InputGroupText>{copy.usernamePrefix}</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput name="username" defaultValue={user.username} autoComplete="username" />
              </InputGroup>
            </Field>
          </div>
          <Field>
            <FieldLabel>{copy.bio}</FieldLabel>
            <Textarea name="bio" defaultValue={user.bio} rows={3} />
            <FieldDescription>{copy.bioHint}</FieldDescription>
          </Field>
        </FieldGroup>
      </Section>
    </form>
  )
}
