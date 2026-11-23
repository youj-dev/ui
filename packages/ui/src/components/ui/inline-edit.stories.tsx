import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, waitFor } from 'storybook/test'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { InlineEdit } from './inline-edit'

const meta: Meta<typeof InlineEdit> = {
  title: 'UI/Inputs/Inline edit',
  component: InlineEdit,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Text that edits in place, for a name, a title or a description. Pressed, the same words sit in a field at the same spot, so nothing jumps: a click puts the caret where it landed, Enter saves, Escape cancels and leaving the field saves. `validate` can refuse a draft, and `onSave` can return a promise: the field stays open with a spinner while it runs, closes with a drawn check when it resolves, and keeps the draft with the reason under it when it rejects. `multiline` edits in a textarea that grows, with Save and Cancel in its frame.',
      },
    },
  },
  argTypes: {
    multiline: { control: 'boolean' },
    actions: { control: 'boolean' },
    saveOnBlur: { control: 'boolean' },
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
  args: { label: 'Project name', multiline: false, saveOnBlur: true, disabled: false },
}
export default meta
type Story = StoryObj<typeof InlineEdit>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Every prop as a control. Saving takes a moment, so the spinner and the check show. */
export const Playground: Story = {
  render: (args) => (
    <div className="w-full max-w-80">
      <InlineEdit {...args} defaultValue="Apollo" onSave={() => wait(900)} />
    </div>
  ),
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function ProjectSettingsPanel() {
  const [name, setName] = useState('Apollo')
  const [description, setDescription] = useState('Mission control for the launch-week dashboards.\nOwned by the platform team.')
  const [slug, setSlug] = useState('apollo-launch')
  const rows = [
    {
      label: 'Name',
      field: (
        <InlineEdit
          label="Name"
          value={name}
          onValueChange={setName}
          validate={(next) => (next.trim() ? null : 'A project needs a name.')}
          onSave={() => wait(700)}
        />
      ),
    },
    {
      label: 'Description',
      multiline: true,
      field: (
        <InlineEdit
          label="Description"
          multiline
          placeholder="Add a description…"
          value={description}
          onValueChange={setDescription}
          onSave={() => wait(900)}
        />
      ),
    },
    {
      label: 'Address',
      field: (
        <InlineEdit
          label="Address"
          value={slug}
          onValueChange={setSlug}
          validate={(next) => (SLUG.test(next) ? null : 'Use lowercase letters, numbers and single dashes.')}
          onSave={async (next) => {
            await wait(800)
            if (next === 'apollo') throw new Error('apollo is taken. Try another address.')
          }}
        />
      ),
    },
  ]
  return (
    <div className="w-full max-w-[520px] rounded-xl border border-line bg-surface p-2">
      <dl className="grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-x-2 gap-y-1">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            {/* Each label lines up with its value's first line: a multi-line one starts past the field's border and padding. */}
            <dt className={`${row.multiline ? 'pt-2.25' : 'py-1.5'} ps-2 text-ui leading-5 text-fg-muted`}>{row.label}</dt>
            <dd className="min-w-0">{row.field}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * A project's settings, edited where they're read: the name saves on Enter or
 * when focus leaves, the description is multi-line with its own Save and
 * Cancel, and the address is checked twice, by `validate` before it saves and
 * by the server as it saves ("apollo" is taken).
 */
export const ProjectSettings: Story = {
  name: 'Project settings',
  render: () => <ProjectSettingsPanel />,
}

/** A card that was just created opens with its title selected (`defaultEditing`), ready to be typed over. */
export const JustCreated: Story = {
  name: 'Just created',
  render: () => (
    <div className="flex w-full max-w-72 flex-col gap-1 rounded-xl border border-line bg-surface p-2">
      <InlineEdit label="Card title" defaultValue="Untitled card" defaultEditing />
      <p className="px-3 pb-1 text-ui-sm text-fg-muted">Backlog · added just now</p>
    </div>
  ),
}

/** `validate` refuses an empty name: the field shakes and stays open with the reason, until it's fixed or Escape cancels. */
export const Refused: Story = {
  name: 'Refused',
  render: (args) => (
    <div className="w-full max-w-80">
      <InlineEdit {...args} label="Name" defaultValue="Apollo" validate={(next) => (next.trim() ? null : 'A project needs a name.')} />
    </div>
  ),
}

/** `onSave` rejects: the draft stays in the field with the server's reason under it, so it can be fixed and saved again. */
export const AsyncFailure: Story = {
  name: 'Async failure',
  render: (args) => (
    <div className="w-full max-w-80">
      <InlineEdit
        {...args}
        label="Address"
        defaultValue="apollo-launch"
        onSave={async () => {
          await wait(900)
          throw new Error('That address is taken.')
        }}
      />
    </div>
  ),
}

/** Multi-line: Enter starts a new line, Ctrl or Command with Enter saves, and Save and Cancel sit in the frame. */
export const Multiline: Story = {
  render: (args) => (
    <div className="w-full max-w-96">
      <InlineEdit
        {...args}
        label="Release notes"
        multiline
        defaultValue={'Faster search across every workspace.\nDark mode for the editor.'}
        onSave={() => wait(900)}
      />
    </div>
  ),
}

/** Empty, it shows its placeholder, muted, and the same words wait in the empty field. */
export const Empty: Story = {
  render: (args) => (
    <div className="w-full max-w-80">
      <InlineEdit {...args} label="Nickname" placeholder="Add a nickname…" />
    </div>
  ),
}

/** Reduced motion: no shake on a refusal, the reason appears at once, and the check is drawn finished. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className="w-full max-w-80">
        <InlineEdit
          {...args}
          label="Name"
          defaultValue="Apollo"
          validate={(next) => (next.trim() ? null : 'A project needs a name.')}
          onSave={() => wait(900)}
        />
      </div>
    </YoujProvider>
  ),
}

/** Where the first line of text starts: in the preview, its span; in the field, past the control's border and padding. */
function textOrigin(root: HTMLElement) {
  const control = root.querySelector<HTMLElement>('input, textarea')
  if (!control) {
    const box = root.querySelector('[data-slot=inline-edit-text]')!.getBoundingClientRect()
    return { left: box.left, top: box.top, middle: box.top + box.height / 2 }
  }
  const box = control.getBoundingClientRect()
  const style = getComputedStyle(control)
  const left = box.left + Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.paddingLeft)
  const top = box.top + Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.paddingTop)
  return { left, top, middle: box.top + box.height / 2 }
}

/**
 * Opened, the field sits exactly where the text was: the words start at the
 * same point on one line (and stay centered in the same height), and on the
 * first line of a multi-line one. The play opens both and checks it.
 */
export const TextHoldsStill: Story = {
  name: 'Text holds still',
  render: () => (
    <div className="flex w-full max-w-80 flex-col gap-4">
      <InlineEdit label="Name" defaultValue="Apollo" />
      <InlineEdit label="Notes" multiline defaultValue={'Launch on Tuesday.\nBring the dashboards.'} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const root of canvasElement.querySelectorAll<HTMLElement>('[data-slot=inline-edit]')) {
      const multiline = root.querySelector('[data-slot=inline-edit-text]')!.textContent!.includes('\n')
      const before = textOrigin(root)
      const height = root.getBoundingClientRect().height
      root.querySelector<HTMLButtonElement>('[data-slot=inline-edit-preview]')!.click()
      await waitFor(() => expect(root.querySelector('input, textarea')).not.toBeNull())
      const after = textOrigin(root)
      expect(Math.abs(after.left - before.left)).toBeLessThanOrEqual(0.5)
      if (multiline) expect(Math.abs(after.top - before.top)).toBeLessThanOrEqual(0.5)
      else {
        expect(Math.abs(after.middle - before.middle)).toBeLessThanOrEqual(0.5)
        expect(root.getBoundingClientRect().height).toBeCloseTo(height, 0)
      }
    }
  },
}
