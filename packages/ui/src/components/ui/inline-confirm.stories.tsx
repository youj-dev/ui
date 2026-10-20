import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { TrashIcon } from '@youj/icons/components/youj/icons/trash'
import { InlineConfirm } from './inline-confirm'

const meta: Meta<typeof InlineConfirm> = {
  title: 'UI/Primitives/Inline Confirm',
  component: InlineConfirm,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A button that confirms in its own place instead of opening a dialog. Pressed, it morphs into “Are you sure?”, a Cancel and the confirm button, and focus moves to the confirm. The confirm is an Async Button: `onConfirm` is awaited through pending to done or failed, then the row folds back into the trigger. Escape or Cancel fold it back and return focus to the trigger; so do focus leaving the row and `timeout` (5 s, paused while the pointer is on it).',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
    variant: { control: 'select', options: ['default', 'secondary', 'outline', 'ghost', 'danger'] },
    destructive: { control: 'boolean' },
    disabled: { control: 'boolean' },
    timeout: { control: 'number' },
  },
  args: { size: 'default', variant: 'outline', destructive: true, disabled: false, timeout: 5000 },
}
export default meta
type Story = StoryObj<typeof InlineConfirm>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Every prop as a control. */
export const Playground: Story = {
  render: (args) => (
    <InlineConfirm {...args} pendingLabel="Deleting…" successLabel="Deleted" onConfirm={() => wait(1200)}>
      Delete
    </InlineConfirm>
  ),
}

/** A row's own delete: a ghost icon-and-label trigger opens the question beside the file it removes. */
export const DeleteRow: Story = {
  name: 'Delete a row',
  args: { variant: 'ghost', size: 'sm' },
  render: (args) => (
    <div className="flex w-full max-w-[460px] items-center justify-between gap-3 rounded-xl border border-line bg-surface py-2 ps-4 pe-2">
      <div className="min-w-0">
        <p className="truncate text-ui font-medium text-fg">q3-forecast.xlsx</p>
        <p className="text-ui-sm text-fg-muted">2.4 MB · edited yesterday</p>
      </div>
      <InlineConfirm {...args} confirmLabel="Delete" pendingLabel="Deleting…" successLabel="Deleted" onConfirm={() => wait(1200)}>
        <TrashIcon />
        Delete
      </InlineConfirm>
    </div>
  ),
}

/** Not every confirmation deletes: without `destructive` the confirm takes the action fill. */
export const NotDestructive: Story = {
  name: 'Not destructive',
  args: { destructive: false, variant: 'secondary' },
  render: (args) => (
    <InlineConfirm
      {...args}
      prompt="Publish to everyone?"
      confirmLabel="Publish"
      pendingLabel="Publishing…"
      successLabel="Published"
      onConfirm={() => wait(1200)}
    >
      Publish
    </InlineConfirm>
  ),
}

/** `onConfirm` rejects: the confirm shakes to a cross and the message (announced assertively), then the row folds back so the person can try again. */
export const AsyncFailure: Story = {
  name: 'Async failure',
  render: (args) => (
    <InlineConfirm
      {...args}
      pendingLabel="Revoking…"
      errorLabel={(error) => (error instanceof Error ? error.message : 'Failed')}
      onConfirm={async () => {
        await wait(1100)
        throw new Error('Key in use')
      }}
    >
      Revoke key
    </InlineConfirm>
  ),
}

/** Reduced motion: the row and the trigger swap at once, with no width morph or crossfade. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <InlineConfirm {...args} onConfirm={() => wait(1200)}>
        Delete
      </InlineConfirm>
    </YoujProvider>
  ),
}
