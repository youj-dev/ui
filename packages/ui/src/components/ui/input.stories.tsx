import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Specimen } from '../../stories/kit'
import { Button } from './button'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'
import { Input } from './input'

const meta: Meta<typeof Input> = {
  title: 'UI/Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI input (a field control, so inside a Field it is labeled, described and validated automatically). 32px on the control scale, 13px text (16px on touch so iOS never zooms). Focus turns the border accent inside a soft 3px halo, which reads as the field being "lit" rather than outlined; a transparent outline rides along so forced-colors mode still shows focus. Invalid swaps both to the destructive token. Only colors transition, on the fast token, so there is nothing to reduce.',
      },
    },
  },
  args: { placeholder: 'name@company.com' },
}
export default meta
type Story = StoryObj<typeof Input>

function InviteRow() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  return (
    <form
      className="flex w-full max-w-[420px] flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        setSent(email)
        setEmail('')
      }}
    >
      <Field>
        <FieldLabel>Invite by email</FieldLabel>
        <div className="flex gap-2">
          <Input type="email" required value={email} onValueChange={setEmail} placeholder="teammate@company.com" autoComplete="off" />
          <Button type="submit">Send invite</Button>
        </div>
        <FieldDescription>They join as a member. You can change roles later.</FieldDescription>
        <FieldError />
      </Field>
      <p role="status" className="text-ui-sm text-fg-muted">
        {sent ? `Invite sent to ${sent}.` : ''}
      </p>
    </form>
  )
}

/** Type an address and send; submitting an invalid one shows the native validation message. */
export const Hero: Story = {
  render: () => <InviteRow />,
}

export const Playground: Story = {
  render: (args) => (
    <div className="w-72">
      <Input aria-label="Email" {...args} />
    </div>
  ),
}

/** Every state, including a focused one (autoFocus) and the native file picker. */
export const States: Story = {
  render: () => (
    <div className="grid w-full max-w-[560px] grid-cols-2 gap-x-6 gap-y-5">
      <Specimen label="empty">
        <Input aria-label="Empty" placeholder="Placeholder" />
      </Specimen>
      <Specimen label="filled">
        <Input aria-label="Filled" defaultValue="Ada Lovelace" />
      </Specimen>
      <Specimen label="focused">
        <Input aria-label="Focused" defaultValue="Focused" autoFocus />
      </Specimen>
      <Specimen label="invalid">
        <Input aria-label="Invalid" defaultValue="ada@" aria-invalid />
      </Specimen>
      <Specimen label="disabled">
        <Input aria-label="Disabled" defaultValue="Can't touch this" disabled />
      </Specimen>
      <Specimen label="read-only">
        <Input aria-label="Read only" defaultValue="acme-prod-7f3a" readOnly />
      </Specimen>
      <Specimen label="file">
        <Input aria-label="Upload" type="file" />
      </Specimen>
      <Specimen label="long value">
        <Input aria-label="Long value" defaultValue="https://acme.com/a/very/long/path/that/keeps/going/and/going?with=query&and=more" />
      </Specimen>
    </div>
  ),
}

/** Inside a Field the label, description and error wire themselves to the input. */
export const InField: Story = {
  render: () => (
    <div className="grid w-80 gap-6">
      <Field required>
        <FieldLabel>Workspace name</FieldLabel>
        <Input defaultValue="Acme" />
        <FieldDescription>Shown in the sidebar and in invite emails.</FieldDescription>
      </Field>
      <Field invalid>
        <FieldLabel>Workspace URL</FieldLabel>
        <Input defaultValue="acme" />
        <FieldError>That URL is taken. Try acme-hq.</FieldError>
      </Field>
      <Field disabled>
        <FieldLabel>Region</FieldLabel>
        <Input defaultValue="eu-central-1" />
        <FieldDescription>Set when the workspace was created.</FieldDescription>
      </Field>
    </div>
  ),
}
