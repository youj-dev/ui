import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core'
import { personOptions } from '../../stories/inputs-data'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'
import { MultiSelect, type MultiSelectOption } from './multi-select'

const meta: Meta<typeof MultiSelect> = {
  title: 'UI/Inputs/Multi-select',
  component: MultiSelect,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Several values from a searchable, grouped list, composed from InputGroup, Badge chips, Popover and Command checkbox rows. Chips fill one line and the rest collapse into “+N”; they enter and leave through PresenceList (a new chip fades into its slot while the others glide aside). “Select all” shows a mixed state over a partial selection, and `maxCount` disables further rows. Keyboard: Backspace or ArrowLeft on the trigger reaches the chips, Backspace/Delete removes one and focus lands on its neighbor; Backspace in an empty search removes the last value. Removals are announced. Reduced motion: instant.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MultiSelect>

function Members({ className = 'w-96' }: { className?: string }) {
  const [value, setValue] = useState(['ada', 'dieter', 'grace'])
  return (
    <Field className={className}>
      <FieldLabel>Members</FieldLabel>
      <MultiSelect
        options={personOptions}
        value={value}
        onValueChange={setValue}
        placeholder="Add members"
        searchPlaceholder="Search people…"
        emptyMessage="Nobody matches."
      />
      <FieldDescription>Members can deploy previews. Owners approve production.</FieldDescription>
    </Field>
  )
}

/** People by team, chips in the field. Add a few to see the overflow count. */
export const Default: Story = { render: () => <Members /> }

const labels: MultiSelectOption[] = [
  { value: 'bug', label: 'Bug', icon: <Dot className="bg-danger" /> },
  { value: 'feature', label: 'Feature', icon: <Dot className="bg-accent" /> },
  { value: 'perf', label: 'Performance', icon: <Dot className="bg-warning" /> },
  { value: 'docs', label: 'Documentation', icon: <Dot className="bg-success" /> },
  { value: 'design', label: 'Design', icon: <Dot className="bg-fg-muted" /> },
  { value: 'infra', label: 'Infrastructure', icon: <Dot className="bg-fg-subtle" /> },
]

function Dot({ className }: { className: string }) {
  return <span aria-hidden className={`size-2 rounded-full ${className}`} />
}

/** At most three labels: the count shows under the list and further rows disable at the limit (announced). */
export const MaxCount: Story = {
  render: () => (
    <Field className="w-80">
      <FieldLabel>Labels</FieldLabel>
      <MultiSelect options={labels} defaultValue={['bug', 'perf']} maxCount={3} placeholder="Add labels" searchPlaceholder="Search labels…" />
      <FieldDescription>Up to three per issue.</FieldDescription>
    </Field>
  ),
}

/** A narrow field: as many chips as fit, then “+N”. The popup is wider than the field. */
export const Overflow: Story = {
  render: () => (
    <Field className="w-60">
      <FieldLabel>Regions</FieldLabel>
      <MultiSelect
        contentClassName="w-72"
        defaultValue={['iad', 'sfo', 'fra', 'hnd', 'syd']}
        options={[
          { value: 'iad', label: 'Washington, D.C.', group: 'Americas' },
          { value: 'sfo', label: 'San Francisco', group: 'Americas' },
          { value: 'gru', label: 'São Paulo', group: 'Americas' },
          { value: 'fra', label: 'Frankfurt', group: 'Europe' },
          { value: 'lhr', label: 'London', group: 'Europe' },
          { value: 'hnd', label: 'Tokyo', group: 'Asia Pacific' },
          { value: 'syd', label: 'Sydney', group: 'Asia Pacific' },
        ]}
      />
    </Field>
  ),
}

const thousands: MultiSelectOption[] = Array.from({ length: 2000 }, (_, i) => ({
  value: `option-${i}`,
  label: `Option number ${i}`,
  description: `person${i}@orion.dev`,
}))

/** 2,000 options: only the best hundred matches are mounted, with a note; searching reaches every one. */
export const LongList: Story = {
  render: () => (
    <Field className="w-96">
      <FieldLabel>Reviewers</FieldLabel>
      <MultiSelect options={thousands} searchPlaceholder="Search 2,000 people…" />
    </Field>
  ),
}

/** Invalid and required with the Field’s error; and disabled with values. */
export const States: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <Field invalid required>
        <FieldLabel>Reviewers</FieldLabel>
        <MultiSelect options={personOptions} placeholder="Add reviewers" />
        <FieldError>Add at least one reviewer.</FieldError>
      </Field>
      <Field disabled>
        <FieldLabel>Labels</FieldLabel>
        <MultiSelect options={labels} defaultValue={['bug', 'docs']} />
      </Field>
    </div>
  ),
}

/**
 * Touch (`YoujProvider device="touch"`, a phone's width): a bottom sheet with the search field and Done at its
 * top and 48px checkbox rows. A tap toggles a row and the sheet stays open; Done, a pull down, a tap outside or
 * Escape puts it away. Tap the field to search: the sheet sits on the keyboard with the field in view.
 */
export const Touch: Story = {
  globals: { viewport: { value: 'mobile2', isRotated: false } },
  decorators: [
    (Story) => (
      <YoujProvider device="touch">
        <Story />
      </YoujProvider>
    ),
  ],
  render: () => <Members className="w-full max-w-96" />,
}
