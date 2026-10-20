import { useState, type FormEvent } from 'react'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core'
import { ArrowLeftRightIcon, PencilIcon } from '@youj/icons'
import { Button } from './button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'
import { Input } from './input'
import { Switch } from './switch'

const meta: Meta<typeof DialogContent> = {
  title: 'UI/Overlays/Dialog',
  component: DialogContent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI dialog. The popup rises 6px while scaling from .96 on the enter curve (motion’s yj-dialog, base token) over a scrim that fades in; it leaves faster than it came. A dialog opened from inside another pushes its parent a step back: the parent sinks, shrinks and dims, so the stack reads as depth. Focus is trapped, starts on the first field and returns to the trigger; Escape and a press on the scrim close it. The scrim is the elevation ink (a thin wash in light, a deep one in dark). Reduced motion: instant, and the parent simply dims.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DialogContent>

const slugify = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function RenameProject() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('Orion')
  const [draft, setDraft] = useState(name)
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState(false)
  const invalid = touched && draft.trim() === ''

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (draft.trim() === '') return
    setSaving(true)
    setTimeout(() => {
      setName(draft.trim())
      setSaving(false)
      setOpen(false)
    }, 900)
  }

  return (
    <div className="flex w-96 items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-subtle font-mono text-ui-sm font-semibold text-accent-text">
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-ui font-semibold">{name}</span>
        <span className="truncate text-ui-sm text-fg-muted">acme.dev/{slugify(name) || '…'}</span>
      </div>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (saving) return
          setOpen(next)
          if (next) {
            setDraft(name)
            setTouched(false)
          }
        }}
      >
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <PencilIcon />
          Rename
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <DialogHeader>
              <DialogTitle>Rename project</DialogTitle>
              <DialogDescription>The name shows in the sidebar and in the project’s URL.</DialogDescription>
            </DialogHeader>
            <Field invalid={invalid}>
              <FieldLabel>Name</FieldLabel>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onFocus={(e) => e.currentTarget.select()}
                disabled={saving}
                autoComplete="off"
              />
              {invalid ? (
                <FieldError>Enter a name for the project.</FieldError>
              ) : (
                <FieldDescription>acme.dev/{slugify(draft) || '…'}</FieldDescription>
              )}
            </Field>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" disabled={saving} />}>Cancel</DialogClose>
              <Button type="submit" loading={saving} loadingLabel="Saving">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Rename a project: the field is focused with its text selected, the URL preview updates as you type, and Save shows its progress before the dialog closes. */
export const Hero: Story = {
  render: () => <RenameProject />,
}

function WorkspaceSettings() {
  const [transferred, setTransferred] = useState('')
  const [transferOpen, setTransferOpen] = useState(false)
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Project settings</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Orion settings</DialogTitle>
          <DialogDescription>
            {transferred ? `Transfer to ${transferred} requested.` : 'Visibility, previews and ownership.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col divide-y divide-line rounded-lg border border-line">
          <Field orientation="horizontal" className="justify-between p-3">
            <FieldLabel>Public preview links</FieldLabel>
            <Switch defaultChecked />
          </Field>
          <Field orientation="horizontal" className="justify-between p-3">
            <FieldLabel>Comments on previews</FieldLabel>
            <Switch />
          </Field>
          <div className="flex items-center justify-between gap-3 p-3">
            <div className="flex flex-col">
              <span className="text-ui font-medium">Transfer ownership</span>
              <span className="text-ui-sm text-fg-muted">Move Orion to another workspace.</span>
            </div>
            <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
              <DialogTrigger render={<Button variant="outline" size="sm" />}>
                <ArrowLeftRightIcon />
                Transfer…
              </DialogTrigger>
              <DialogContent>
                <TransferForm
                  onDone={(workspace) => {
                    setTransferred(workspace)
                    setTransferOpen(false)
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button />}>Done</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TransferForm({ onDone }: { onDone: (workspace: string) => void }) {
  const [workspace, setWorkspace] = useState('')
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        onDone(workspace || 'acme-labs')
      }}
    >
      <DialogHeader>
        <DialogTitle>Transfer Orion</DialogTitle>
        <DialogDescription>Deployments keep running. Members of this workspace lose access.</DialogDescription>
      </DialogHeader>
      <Field>
        <FieldLabel>Destination workspace</FieldLabel>
        <Input value={workspace} onChange={(e) => setWorkspace(e.target.value)} placeholder="acme-labs" />
      </Field>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
        <Button type="submit">Transfer</Button>
      </DialogFooter>
    </form>
  )
}

/** A dialog opened from a dialog: the parent sinks, shrinks and dims behind it, and comes back forward when it closes. */
export const Nested: Story = {
  render: () => <WorkspaceSettings />,
}

function Changelog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>Read the changelog</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Changelog</DialogTitle>
          <DialogDescription>Everything that shipped in September.</DialogDescription>
        </DialogHeader>
        {Array.from({ length: 14 }, (_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span className="text-ui font-medium">4.{14 - i}.0</span>
            <p className="text-ui text-fg-muted">
              Faster cold starts on the edge runtime, preview comments that sync with your tracker, and a new audit log
              filter for deployments.
            </p>
          </div>
        ))}
        <DialogFooter>
          <DialogClose render={<Button />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Long content: the page behind stays put and the dialog scrolls within the viewport, starting from its top. */
export const LongContent: Story = {
  render: () => <Changelog />,
}

/* A phone's version of the stories above: the subtree is forced to touch
 * (keeping the toolbar's Speed and Motion settings) in a phone-wide column. */
const onTouch: Decorator = (Story, context) => (
  <YoujProvider
    device="touch"
    timeScale={Number(context.globals.timeScale ?? 1)}
    reducedMotion={(context.globals.reducedMotion as ReducedMotionSetting | undefined) ?? 'user'}
  >
    <div className="mx-auto flex w-full max-w-sm flex-col items-stretch gap-4 [&>*]:w-full">
      <Story />
    </div>
  </YoujProvider>
)

/**
 * On touch the same dialogs are bottom sheets: they rise from the bottom edge
 * with a grab handle, pull down to dismiss (a short pull springs back), scroll
 * inside up to 90% of the screen and stack their actions full width. Opened by
 * a tap, focus goes to the sheet, not the field, so the keyboard waits for a
 * tap on it. Transfer… opens a sheet over a sheet; the one below recedes.
 */
export const Touch: Story = {
  decorators: [onTouch],
  parameters: { layout: 'padded' },
  render: () => (
    <>
      <RenameProject />
      <div className="flex flex-wrap gap-2">
        <WorkspaceSettings />
        <Changelog />
      </div>
    </>
  ),
}
