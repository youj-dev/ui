import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Button } from './button'
import { SlideToConfirm } from './slide-to-confirm'

const meta: Meta<typeof SlideToConfirm> = {
  title: 'UI/Primitives/Slide To Confirm',
  component: SlideToConfirm,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A confirmation that takes a deliberate gesture: drag the thumb to the end of the track. Short of 90% it springs back; past it, `onConfirm` runs and the thumb spins, then the track takes the success fill with a check and stays confirmed. A rejection turns it to a cross, shows its message in the track and springs back. The thumb is a slider: arrows, Home and End move it and Enter at the end confirms. The track label fades as the thumb passes, and the whole control mirrors in right-to-left.',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
    tone: { control: 'inline-radio', options: ['default', 'danger'] },
    disabled: { control: 'boolean' },
  },
  args: { size: 'default', tone: 'default', disabled: false },
}
export default meta
type Story = StoryObj<typeof SlideToConfirm>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Every prop as a control. Remount with the button to slide again. */
export const Playground: Story = {
  render: function Render(args) {
    const [key, setKey] = useState(0)
    return (
      <div className="flex w-full max-w-[360px] flex-col items-center gap-4">
        <SlideToConfirm key={key} {...args} onConfirm={() => wait(1200)} />
        <Button variant="ghost" size="sm" onClick={() => setKey((n) => n + 1)}>
          Reset
        </Button>
      </div>
    )
  },
}

/** A checkout's last step: slide to pay, Paying… on the thumb's spinner, then ✓ Paid. */
export const ConfirmPayment: Story = {
  name: 'Confirm payment',
  render: (args) => (
    <div className="flex w-full max-w-[380px] flex-col gap-4 rounded-xl border border-line bg-surface p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-ui font-medium text-fg">Northwind Ltd</p>
        <p className="text-ui-lg font-semibold text-fg tabular-nums">€1,240.00</p>
      </div>
      <p className="text-ui-sm text-fg-muted">Invoice INV-2041 · from Business account ••4417</p>
      <SlideToConfirm {...args} label="Slide to pay €1,240" confirmingLabel="Paying…" confirmedLabel="Paid" onConfirm={() => wait(1400)} />
    </div>
  ),
}

/** `tone="danger"` for what can't be undone: the thumb takes the danger fill and the track a danger wash as it moves. */
export const Danger: Story = {
  args: { tone: 'danger' },
  render: (args) => (
    <div className="flex w-full max-w-[380px] flex-col gap-4 rounded-xl border border-danger-line bg-danger-subtle p-5">
      <div>
        <p className="text-ui font-medium text-fg">Delete workspace “atlas”</p>
        <p className="text-ui-sm text-fg-muted">12 projects, 38 members and every deployment go with it.</p>
      </div>
      <SlideToConfirm {...args} label="Slide to delete workspace" confirmingLabel="Deleting…" confirmedLabel="Deleted" onConfirm={() => wait(1400)} />
    </div>
  ),
}

/** `onConfirm` rejects: the thumb turns to a cross and springs back, the message shows in the track (and is announced assertively), then the label returns. Slide again to retry. */
export const AsyncFailure: Story = {
  name: 'Async failure',
  render: (args) => (
    <div className="w-full max-w-[380px]">
      <SlideToConfirm
        {...args}
        label="Slide to transfer"
        confirmingLabel="Transferring…"
        onConfirm={async () => {
          await wait(1100)
          throw new Error('Insufficient funds')
        }}
      />
    </div>
  ),
}

/** Reduced motion: the thumb follows the pointer as always, but it is back at the start (or at the end) at once, with no spring; the thumb’s marks swap at once and the spinner holds still. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className="w-full max-w-[380px]">
        <SlideToConfirm {...args} onConfirm={() => wait(1200)} />
      </div>
    </YoujProvider>
  ),
}
