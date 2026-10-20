import { useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { motion } from 'motion/react'
import { RefreshCw, Send } from 'lucide-react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { cn } from '@youj/core/lib/youj/cn'
import { useMorphRoot } from '../transitions/morph-label'
import { AsyncAnnouncer, AsyncFeedback, useAsyncAction, type AsyncFeedbackProps } from './async-feedback'

interface Args {
  outcome: 'success' | 'error'
  latency: number
}

const meta: Meta<Args> = {
  title: 'Motion/Effects/AsyncFeedback',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The async feedback behind @youj/react’s Button `onAction`, for any control. `useAsyncAction(onAction)` runs the work (idle → pending → success | error → idle, re-entry guarded synchronously, synchronous throws caught, nothing after unmount). `AsyncFeedback` is what the control shows, built on MorphLabel: the label morphs to a spinner, then to a drawn CheckIcon or cross with its label; errors shake with a decaying 4/3/2 px amplitude; success and error tint the surface. `AsyncAnnouncer` speaks it (pending and success politely, errors assertively) from outside the control. Put it inside a `useMorphRoot` box so the control’s width morphs too. Reduced motion shows text instead of the spinner and swaps instantly.',
      },
    },
  },
  argTypes: {
    outcome: { control: 'inline-radio', options: ['success', 'error'] },
    latency: { control: { type: 'range', min: 300, max: 4000, step: 100 } },
  },
  args: { outcome: 'success', latency: 1400 },
}
export default meta
type Story = StoryObj<Args>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type Labels = Pick<AsyncFeedbackProps, 'pendingLabel' | 'successLabel' | 'errorLabel'>

/** How a UI button composes the effect: morph root + feedback inside, announcer beside. */
function AsyncButton({
  onAction,
  children,
  variant = 'primary',
  ...labels
}: Labels & { onAction: () => Promise<unknown>; children: ReactNode; variant?: 'primary' | 'outline' }) {
  const { state, run } = useAsyncAction(onAction)
  const morph = useMorphRoot(8)
  return (
    <>
      <motion.button
        type="button"
        {...morph}
        onClick={run}
        aria-busy={state === 'pending' || undefined}
        data-state={state}
        className={cn(
          'relative inline-flex h-8 items-center justify-center overflow-hidden px-3 text-[13px] font-medium outline-none select-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          variant === 'primary' ? 'bg-fg text-canvas' : 'border border-line bg-surface text-fg hover:bg-hover',
          (state === 'success' || state === 'error') && 'border-transparent text-on-accent',
        )}
      >
        <AsyncFeedback state={state} {...labels}>
          {children}
        </AsyncFeedback>
      </motion.button>
      <AsyncAnnouncer state={state} {...labels} />
    </>
  )
}

function InviteForm({ outcome, latency }: Args) {
  const [email, setEmail] = useState('grace@acme.com')
  const act = async () => {
    await wait(latency)
    if (outcome === 'error') throw new Error('nope')
  }
  return (
    <div className="w-full max-w-[480px] overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <p className="text-sm font-medium text-fg">Invite a teammate</p>
        <p className="text-xs text-fg-muted">They’ll get an email with a link to join acme.</p>
      </div>
      <div className="flex items-center gap-2 px-5 py-4">
        <label className="sr-only" htmlFor="invite-email">
          Email
        </label>
        <input
          id="invite-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-8 flex-1 rounded-md border border-line bg-canvas px-2.5 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <AsyncButton onAction={act} pendingLabel="Sending…" successLabel="Invited" errorLabel="Couldn’t send">
          <Send aria-hidden className="size-3.5" />
          Send invite
        </AsyncButton>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line bg-canvas px-5 py-3 text-xs text-fg-muted">
        Last synced 2 minutes ago
        <AsyncButton variant="outline" onAction={act} pendingLabel="Syncing…" successLabel="Synced" errorLabel="Sync failed">
          <RefreshCw aria-hidden className="size-3.5" />
          Sync
        </AsyncButton>
      </div>
    </div>
  )
}

/** An invite form: “Send invite” and “Sync” are UI-style buttons composed from the effect. Flip `outcome` to see the error path. */
export const Hero: Story = {
  render: (args) => <InviteForm {...args} />,
}

export const ErrorPath: Story = {
  args: { outcome: 'error' },
  render: (args) => <InviteForm {...args} />,
}

/** Reduced motion: “Sending…” text instead of a spinner, instant swaps and tints, no shake. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <InviteForm {...args} />
    </YoujProvider>
  ),
}
