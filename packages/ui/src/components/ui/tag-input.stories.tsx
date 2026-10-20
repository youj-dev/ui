import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'
import { TagInput } from './tag-input'

const meta: Meta<typeof TagInput> = {
  title: 'UI/Inputs/Tag input',
  component: TagInput,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Free-form values as Badge chips in an InputGroup. Enter or a comma adds; a pasted list adds each item. A rejected value stays in the field while the frame shakes, the border turns destructive and the reason grows in (Collapse) and is read out; a duplicate flashes the chip that already holds it. Chips enter, leave and reorder through PresenceList. On a chip, arrows move focus, Alt+arrows move the chip, Backspace/Delete removes it. Reduced motion: no shake or glide.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof TagInput>

const topicRule = (tag: string) => {
  if (!/^[a-z0-9-]+$/.test(tag)) return 'Use lowercase letters, numbers and hyphens.'
  if (tag.length > 24) return 'Keep topics under 25 characters.'
}

function Topics() {
  const [topics, setTopics] = useState(['react', 'design-systems', 'motion'])
  return (
    <Field className="w-96">
      <FieldLabel>Topics</FieldLabel>
      <TagInput value={topics} onValueChange={setTopics} validate={topicRule} maxTags={8} placeholder="Add a topic…" />
      <FieldDescription>Press Enter or comma to add. Try “Motion” (a duplicate) or “UI Kit” (invalid).</FieldDescription>
    </Field>
  )
}

/** Repository topics: validated, deduplicated, at most eight. */
export const Default: Story = { render: () => <Topics /> }

/** Paste “alpha, beta, gamma” or a list with one item per line: each becomes a chip; invalid ones stay in the field. */
export const PasteAList: Story = {
  render: () => (
    <Field className="w-96">
      <FieldLabel>Allowed email domains</FieldLabel>
      <TagInput
        defaultValue={['orion.dev']}
        placeholder="Paste or type domains…"
        validate={(tag) => (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(tag) ? undefined : `“${tag}” isn’t a domain.`)}
      />
      <FieldDescription>Anyone with an address at these domains can join.</FieldDescription>
    </Field>
  ),
}

const emailRule = (tag: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(tag) ? undefined : `“${tag}” isn’t an email address.`)

function InviteRecipients() {
  const [emails, setEmails] = useState(['mara@northwind.dev', 'ilya@northwind.dev', 'sol@kestrel.studio'])
  return (
    <Field className="w-full max-w-[440px]">
      <FieldLabel>Invite by email</FieldLabel>
      <TagInput
        value={emails}
        onValueChange={setEmails}
        validate={emailRule}
        maxTags={10}
        name="invite"
        placeholder="name@company.com"
      />
      <FieldDescription>
        {emails.length ? `${emails.length} of 10 invites. ` : ''}Press Enter after each one, or paste a list.
      </FieldDescription>
    </Field>
  )
}

/** Inviting people: email addresses as chips, each checked as it's added. Try “mara@” (rejected) or paste “a@x.io, b@y.io”. */
export const InviteByEmail: Story = { render: () => <InviteRecipients /> }

/** Many tags wrap, and the field keeps typing inline after the last chip. Alt+arrows reorder a focused chip. */
export const ManyTags: Story = {
  render: () => (
    <Field className="w-80">
      <FieldLabel>Keywords</FieldLabel>
      <TagInput
        defaultValue={['accessibility', 'animation', 'base-ui', 'components', 'design-tokens', 'motion', 'react', 'shadcn', 'storybook', 'tailwind']}
      />
    </Field>
  ),
}

/** Required and invalid with the Field’s error; and disabled. */
export const States: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <Field invalid required>
        <FieldLabel>Labels</FieldLabel>
        <TagInput />
        <FieldError>Add at least one label.</FieldError>
      </Field>
      <Field disabled>
        <FieldLabel>Labels</FieldLabel>
        <TagInput defaultValue={['bug', 'p1']} disabled />
      </Field>
    </div>
  ),
}
