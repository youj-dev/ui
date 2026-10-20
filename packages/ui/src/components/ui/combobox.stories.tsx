import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core'
import { frameworks, personOptions, searchPeople } from '../../stories/inputs-data'
import { Combobox, type ComboboxOption } from './combobox'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'

const meta: Meta<typeof Combobox> = {
  title: 'UI/Inputs/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A single-select picker with search, composed from Popover and Command: the popup grows out of the trigger on yj-pop, the active row glides, the list eases its height, and the chosen row draws its check. Typing on the trigger opens it already searching. Supports groups, async results with a loading row, a “Create …” row, and clearing (button or Delete, announced). Label it with a FieldLabel. Reduced motion: everything is instant.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Combobox>

function Owner() {
  const [owner, setOwner] = useState<string | null>('grace')
  return (
    <Field className="w-80">
      <FieldLabel>Owner</FieldLabel>
      <Combobox
        options={personOptions}
        value={owner}
        onValueChange={setOwner}
        placeholder="Assign an owner"
        searchPlaceholder="Search people…"
        emptyMessage="Nobody matches."
        clearable
      />
      <FieldDescription>Gets deploy alerts and approves production releases.</FieldDescription>
    </Field>
  )
}

/** People grouped by team, with avatars and emails. Clearable. */
export const Default: Story = { render: () => <Owner /> }

function AsyncOwner() {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<ComboboxOption[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    let live = true
    setLoading(true)
    searchPeople(search).then((r) => {
      if (!live) return
      setResults(r)
      setLoading(false)
    })
    return () => {
      live = false
    }
  }, [search])
  return (
    <Field className="w-80">
      <FieldLabel>Reviewer</FieldLabel>
      <Combobox
        options={results}
        onSearchChange={setSearch}
        loading={loading}
        loadingLabel="Searching the directory…"
        placeholder="Find a reviewer"
        searchPlaceholder="Search the directory…"
        emptyMessage={`Nobody called “${search}”.`}
      />
      <FieldDescription>Results come from a (simulated) directory search.</FieldDescription>
    </Field>
  )
}

/** Async search: the list shows a loading row (announced) while results load, and the empty message waits for it. */
export const Async: Story = { render: () => <AsyncOwner /> }

function Creatable() {
  const [options, setOptions] = useState(frameworks)
  const [value, setValue] = useState<string | null>(null)
  return (
    <Field className="w-72">
      <FieldLabel>Framework</FieldLabel>
      <Combobox
        options={options}
        value={value}
        onValueChange={setValue}
        placeholder="Pick a framework"
        searchPlaceholder="Search or create…"
        onCreate={(label) => {
          const option = { value: label.toLowerCase().replace(/\W+/g, '-'), label }
          setOptions((o) => [...o, option])
          return option
        }}
      />
      <FieldDescription>Type one that isn’t listed to create it.</FieldDescription>
    </Field>
  )
}

/** “Create …” appears for text that matches no option; the new option is selected. */
export const Create: Story = { render: () => <Creatable /> }

/** Invalid and required, with the Field’s error; and disabled. */
export const States: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <Field invalid required>
        <FieldLabel>Region</FieldLabel>
        <Combobox
          options={[
            { value: 'iad', label: 'Washington, D.C.', description: 'iad1' },
            { value: 'fra', label: 'Frankfurt', description: 'fra1' },
            { value: 'hnd', label: 'Tokyo', description: 'hnd1' },
          ]}
          placeholder="Choose a region"
        />
        <FieldError>Choose where functions run.</FieldError>
      </Field>
      <Field disabled>
        <FieldLabel>Team</FieldLabel>
        <Combobox options={[{ value: 'core', label: 'Core platform' }]} defaultValue="core" />
        <FieldDescription>Only owners can move a project.</FieldDescription>
      </Field>
    </div>
  ),
}

/** Long labels truncate in the trigger and the rows; the popup can be wider than a narrow trigger. */
export const LongContent: Story = {
  render: () => (
    <Field className="w-56">
      <FieldLabel>Environment</FieldLabel>
      <Combobox
        defaultValue="preview-long"
        contentClassName="w-80"
        options={[
          { value: 'production', label: 'Production' },
          { value: 'preview-long', label: 'Preview: feature/stream-search-results-from-the-edge' },
          { value: 'staging', label: 'Staging (eu-central-1, shared with the billing team)' },
        ]}
      />
    </Field>
  ),
}

const thousands: ComboboxOption[] = Array.from({ length: 2000 }, (_, i) => ({
  value: `option-${i}`,
  label: `Option number ${i}`,
  description: `person${i}@orion.dev`,
}))

/** 2,000 options: only the best hundred matches are mounted, with a note; searching reaches every one. */
export const LongList: Story = {
  render: () => (
    <Field className="w-80">
      <FieldLabel>Assignee</FieldLabel>
      <Combobox options={thousands} placeholder="Assign someone" searchPlaceholder="Search 2,000 people…" />
    </Field>
  ),
}

/**
 * Touch (`YoujProvider device="touch"`, a phone's width): the list is a bottom sheet with the search field at
 * its top and 48px rows. It opens with the keyboard down; tap the field to search, and the sheet sits on the
 * keyboard with the field in view, keeping its height as results narrow. A tap picks and closes it; pull it
 * down, tap outside or press Escape to dismiss it. `presentation="popover"` keeps the popover on touch.
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
  render: () => <Owner />,
}
