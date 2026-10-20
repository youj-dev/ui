import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { AsyncState } from '@youj/motion'
import { RefreshIcon } from '@youj/icons'
import { TrashIcon } from '@youj/icons/components/youj/icons/trash'
import { Button } from './button'
import { AsyncButton } from './async-button'

const meta: Meta<typeof AsyncButton> = {
  title: 'UI/Primitives/Async Button',
  component: AsyncButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A Button that runs async work on press and shows its whole lifecycle in place. `onAction` is the driver: the label morphs Save → Saving… → ✓ Saved (or shakes to ✕ Couldn’t save) with motion\'s MorphLabel while the box morphs to each width on the same spring, tints success and error, keeps focus, and announces every state (errors assertively). A double click starts one action. `status` is the controlled alternative for work started elsewhere (a mutation\'s status); pass one of the two, never both.',
      },
    },
  },
  args: { children: 'Save' },
}
export default meta

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface AsyncArgs {
  outcome: 'success' | 'error'
  latency: number
}

function AsyncActions({ outcome, latency }: AsyncArgs) {
  const act = async () => {
    await wait(latency)
    if (outcome === 'error') throw new Error('offline')
  }
  return (
    <div className="flex w-full max-w-[560px] flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <div>
          <p className="text-ui font-medium text-fg">Profile</p>
          <p className="text-ui-sm text-fg-muted">Name, avatar and time zone.</p>
        </div>
        <AsyncButton onAction={act} pendingLabel="Saving…" successLabel="Saved" errorLabel="Couldn’t save">
          Save
        </AsyncButton>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
        <div>
          <p className="text-ui font-medium text-fg">GitHub</p>
          <p className="text-ui-sm text-fg-muted">Last synced 2 minutes ago.</p>
        </div>
        <div className="flex items-center gap-2">
          <AsyncButton variant="outline" size="sm" onAction={act} pendingLabel="Syncing…" successLabel="Synced" errorLabel="Sync failed">
            <RefreshIcon />
            Sync
          </AsyncButton>
          <AsyncButton variant="ghost" size="icon-sm" aria-label="Refresh status" onAction={act} successLabel="Refreshed" errorLabel="Refresh failed">
            <RefreshIcon />
          </AsyncButton>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-danger-line bg-danger-subtle px-4 py-3">
        <div>
          <p className="text-ui font-medium text-fg">Preview deployments</p>
          <p className="text-ui-sm text-fg-muted">Deletes 14 previews older than 30 days.</p>
        </div>
        <AsyncButton variant="danger" onAction={act} pendingLabel="Deleting…" successLabel="Deleted" errorLabel="Couldn’t delete">
          <TrashIcon />
          Delete previews
        </AsyncButton>
      </div>
    </div>
  )
}

/**
 * `onAction`: the button runs the work itself. Save → Saving… → ✓ Saved, the box morphing to each width on
 * one spring. Flip `outcome` to error for the shake and the assertive announcement; double-click to see that
 * only one action starts. Icon-only buttons stay square and announce their labels.
 */
export const Action: StoryObj<AsyncArgs> = {
  argTypes: {
    outcome: { control: 'inline-radio', options: ['success', 'error'] },
    latency: { control: { type: 'range', min: 300, max: 4000, step: 100 } },
  },
  args: { outcome: 'success', latency: 1400 },
  render: (args) => <AsyncActions {...args} />,
}

/** The error path: the label shakes (4 / 3 / 2 px, decaying) to a cross over a danger tint, and the error is announced assertively. */
export const ActionError: StoryObj<AsyncArgs> = {
  args: { outcome: 'error', latency: 900 },
  render: (args) => <AsyncActions {...args} />,
}


const states: AsyncState[] = ['idle', 'pending', 'success', 'error']

function ControlledDemo() {
  const [status, setStatus] = useState<AsyncState>('idle')
  return (
    <div className="flex flex-col items-start gap-4">
      <AsyncButton status={status} onClick={() => setStatus('pending')} pendingLabel="Saving…" successLabel="Saved" errorLabel="Couldn’t save">
        Save
      </AsyncButton>
      <div className="flex gap-2">
        {states.map((next) => (
          <Button key={next} variant="outline" size="sm" onClick={() => setStatus(next)}>
            {next}
          </Button>
        ))}
      </div>
    </div>
  )
}

/** `status`: the same lifecycle for work started elsewhere. Pick a status below; success and error hold, then return to rest. */
export const Controlled: StoryObj = {
  render: () => <ControlledDemo />,
}

/**
 * `hold`: the action runs only once a press is held. Press and hold (or hold Space or Enter): the fill sweeps
 * from the inline start, letting go early springs it back, and a full hold runs the action, then Deleting… →
 * ✓ Deleted. It's described as "Hold to confirm". `true` holds for twice the deliberate token.
 */
export const HoldToDeleteProject: StoryObj<AsyncArgs> = {
  name: 'Hold to delete project',
  args: { outcome: 'success', latency: 1200 },
  render: ({ outcome, latency }) => (
    <div className="flex w-full max-w-[480px] items-center justify-between gap-4 rounded-xl border border-danger-line bg-danger-subtle px-4 py-3">
      <div>
        <p className="text-ui font-medium text-fg">Delete “atlas-web”</p>
        <p className="text-ui-sm text-fg-muted">Removes 214 deployments and every domain.</p>
      </div>
      <AsyncButton
        variant="danger"
        hold
        onAction={async () => {
          await wait(latency)
          if (outcome === 'error') throw new Error('locked')
        }}
        pendingLabel="Deleting…"
        successLabel="Deleted"
        errorLabel="Couldn’t delete"
      >
        <TrashIcon />
        Delete project
      </AsyncButton>
    </div>
  ),
}

/**
 * `hold` on an AsyncButton: the payment runs only once the press is held to the end. Holding fills the button;
 * letting go early springs it back. A full hold confirms, and the button carries on through Sending… → ✓ Sent.
 */
export const HoldToSendPayment: StoryObj<AsyncArgs> = {
  name: 'Hold to send payment',
  argTypes: {
    outcome: { control: 'inline-radio', options: ['success', 'error'] },
  },
  args: { outcome: 'success', latency: 1400 },
  render: ({ outcome, latency }) => (
    <div className="flex w-full max-w-[420px] items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3">
      <div>
        <p className="text-ui font-medium text-fg">€1,240.00 to Northwind Ltd</p>
        <p className="text-ui-sm text-fg-muted">Invoice INV-2041 · arrives today</p>
      </div>
      <AsyncButton
        hold
        onAction={async () => {
          await wait(latency)
          if (outcome === 'error') throw new Error('declined')
        }}
        pendingLabel="Sending…"
        successLabel="Sent"
        errorLabel="Payment declined"
      >
        Send payment
      </AsyncButton>
    </div>
  ),
}
