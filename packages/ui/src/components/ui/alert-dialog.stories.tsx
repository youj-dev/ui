import { useState } from 'react'
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider, type ReducedMotionSetting } from '@youj/core'
import { KeyIcon, TrashIcon } from '@youj/icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  ConfirmDialog,
} from './alert-dialog'
import { Button } from './button'
import { Checkbox } from './checkbox'

const meta: Meta<typeof ConfirmDialog> = {
  title: 'UI/Overlays/Alert Dialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI alert dialog: it asks before something happens. Same motion as Dialog (yj-dialog over a fading scrim), but a press outside doesn’t close it; Escape cancels. Focus starts on the least destructive control (Cancel, or the field to fill) and returns to the trigger. ConfirmDialog, ported from atelier-ui, is the opinionated version: the confirm button names its action, an async confirm keeps the dialog open until the work lands (and shows the error if it fails), and `challenge` arms a wide destructive action only once its phrase is typed; a check draws in when it matches. Reduced motion: instant.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ConfirmDialog>

const allProjects = [
  'orion',
  'andromeda',
  'cassiopeia',
  'draco',
  'lyra',
  'pegasus',
  'perseus',
  'phoenix',
  'sagittarius',
  'scorpius',
  'taurus',
  'ursa-major',
  'vela',
  'virgo',
]

function BulkDelete({ fail = false }: { fail?: boolean }) {
  const [projects, setProjects] = useState(allProjects)
  const [selected, setSelected] = useState<Set<string>>(new Set(allProjects.slice(0, 12)))
  const [open, setOpen] = useState(false)
  // What the dialog is about, fixed when it opens, so its text holds still while it animates out.
  const [doomed, setDoomed] = useState<string[]>([])
  const count = doomed.length
  const toggle = (name: string, on: boolean) =>
    setSelected((s) => {
      const next = new Set(s)
      if (on) next.add(name)
      else next.delete(name)
      return next
    })

  return (
    <div className="flex w-[26rem] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-sm">
      <div className="flex h-11 items-center justify-between gap-3 border-b border-line px-3">
        <span className="text-ui text-fg-muted" role="status">
          {selected.size > 0 ? `${selected.size} selected` : `${projects.length} projects`}
        </span>
        <Button
          variant="danger"
          size="sm"
          disabled={selected.size === 0}
          focusableWhenDisabled
          onClick={() => {
            setDoomed([...selected])
            setOpen(true)
          }}
        >
          <TrashIcon />
          Delete
        </Button>
      </div>
      <ul className="max-h-64 overflow-y-auto p-1">
        {projects.map((name) => (
          <li key={name}>
            <label className="flex h-control items-center gap-3 rounded-md px-2 text-ui hover:bg-hover">
              <Checkbox checked={selected.has(name)} onCheckedChange={(on) => toggle(name, on)} />
              <span className="font-mono text-ui-sm">acme/{name}</span>
            </label>
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        destructive
        icon={<TrashIcon />}
        title={`Delete ${count} projects?`}
        description="Their deployments, domains and environment variables are deleted with them. This can’t be undone."
        confirmLabel={`Delete ${count} projects`}
        pendingLabel={`Deleting ${count} projects`}
        challenge={`delete ${count} projects`}
        onConfirm={() =>
          new Promise<void>((resolve, reject) =>
            setTimeout(() => {
              if (fail) {
                reject(new Error('acme/orion has a deployment in progress. Stop it, then try again.'))
                return
              }
              setProjects((p) => p.filter((name) => !doomed.includes(name)))
              setSelected(new Set())
              resolve()
            }, 1200),
          )
        }
      >
        <ul className="flex flex-col gap-1 rounded-lg border border-line bg-transparent px-3 py-2 font-mono text-ui-sm text-fg-muted">
          {doomed.slice(0, 3).map((name) => (
            <li key={name}>acme/{name}</li>
          ))}
          {count > 3 && <li className="font-sans">and {count - 3} more</li>}
        </ul>
      </ConfirmDialog>
    </div>
  )
}

/** A bulk delete: the confirm names its action and arms only once the phrase is typed. It holds while the deletion runs. */
export const Hero: Story = {
  render: () => <BulkDelete />,
}

/** When the work fails the dialog stays open, the confirm settles back, and the reason shows beside the choice. */
export const FailedConfirm: Story = {
  render: () => <BulkDelete fail />,
}

function DeleteResource({ name, kind, fail = false, startOpen = false }: { name: string; kind: string; fail?: boolean; startOpen?: boolean }) {
  const [open, setOpen] = useState(startOpen)
  const [gone, setGone] = useState(false)
  return (
    <div className="flex w-96 items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-ui font-medium">{name}</span>
        <span className="text-ui-sm text-fg-muted">{gone ? 'Deleted' : kind}</span>
      </div>
      <Button variant="danger" size="sm" disabled={gone} onClick={() => setOpen(true)}>
        Delete {kind}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        destructive
        icon={<TrashIcon />}
        title={`Delete ${name}?`}
        description="This can’t be undone."
        consequences={['12 deployments and their logs', '3 custom domains', '48 environment variables', 'Access for 7 members']}
        confirmLabel={`Delete ${kind}`}
        pendingLabel={`Deleting ${kind}`}
        challenge={name}
        onConfirm={() =>
          new Promise<void>((resolve, reject) =>
            setTimeout(() => {
              if (fail) reject(new Error('A deployment is in progress. Stop it, then try again.'))
              else {
                setGone(true)
                resolve()
              }
            }, 1200),
          )
        }
      />
    </div>
  )
}

/** High-impact delete: the consequences, the phrase in a copyable chip, a confirm that arms on an exact match. */
export const TypeToConfirm: Story = {
  render: () => <DeleteResource name="acme/orion" kind="project" />,
}

/** The same dialog, open, for review. */
export const TypeToConfirmOpen: Story = {
  render: () => <DeleteResource name="acme/orion" kind="project" startOpen />,
}

/** A rejected delete keeps the dialog open with the reason, and the typed phrase stays. */
export const TypeToConfirmFails: Story = {
  render: () => <DeleteResource name="acme" kind="account" fail />,
}

function RevokeKey() {
  const [open, setOpen] = useState(false)
  const [revoked, setRevoked] = useState(false)
  return (
    <div className="flex w-96 items-center gap-3 rounded-xl border border-line bg-surface p-4 shadow-xs">
      <KeyIcon className="size-4 text-fg-muted" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-ui font-medium">Production deploy key</span>
        <span className="font-mono text-ui-sm text-fg-muted">sk_demo_••••4f2a{revoked && ' · revoked'}</span>
      </div>
      <Button variant="outline" size="sm" disabled={revoked} onClick={() => setOpen(true)}>
        Revoke
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        destructive
        icon={<KeyIcon />}
        title="Revoke this key?"
        description="Deploys that use it start failing immediately. You can create a new key afterwards."
        confirmLabel="Revoke key"
        onConfirm={() => setRevoked(true)}
      />
    </div>
  )
}

/** A single destructive confirm with an icon badge. Focus starts on Cancel. */
export const Revoke: Story = {
  render: () => <RevokeKey />,
}

function DiscardChanges() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('Editing “Release notes”, 3 unsaved changes')
  return (
    <div className="flex flex-col items-center gap-3">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger render={<Button variant="outline" />}>Close editor</AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>Your edits to “Release notes” haven’t been saved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              onClick={() => {
                setStatus('Editor closed, changes discarded')
                setOpen(false)
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p role="status" className="text-ui-sm text-fg-muted">
        {status}
      </p>
    </div>
  )
}

/** The parts, composed by hand: a short question in the small size, over two equal buttons. */
export const Discard: Story = {
  render: () => <DiscardChanges />,
}

/* A phone's version: the subtree is forced to touch (keeping the toolbar's
 * Speed and Motion settings) in a phone-wide column. */
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
 * On touch an alert stays a centered alert, as a phone's own are, and it is
 * not a sheet: it can't be pulled away, it wants an answer. The actions stack
 * full width with the primary on top, at least 44px tall; the small size keeps
 * its two buttons side by side.
 */
export const Touch: Story = {
  decorators: [onTouch],
  parameters: { layout: 'padded' },
  render: () => (
    <>
      <RevokeKey />
      <DiscardChanges />
    </>
  ),
}
