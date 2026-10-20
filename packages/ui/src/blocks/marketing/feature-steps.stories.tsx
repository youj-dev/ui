import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Badge } from '../../components/ui/badge'
import { FeatureSteps } from './feature-steps'

const meta: Meta<typeof FeatureSteps> = {
  title: 'Blocks/Marketing/Feature steps',
  component: FeatureSteps,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section', preset: 'brutal' },
    docs: {
      description: {
        component:
          'Explain how your product works as a release you can watch: a lens rides the track from step to step, each picture plays its moment as it arrives, and visitors can pick any step.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FeatureSteps>

export const Default: Story = {}

/** Inside a docs or product page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="sr-only">Getting started with Northwind</h1>
      <FeatureSteps {...args} />
    </main>
  ),
}

const note = (text: string, badge: string) => (
  <div className="flex flex-1 items-center justify-between gap-2 rounded-lg border border-line bg-surface p-3 text-ui-sm shadow-xs">
    {text}
    <Badge variant="secondary">{badge}</Badge>
  </div>
)

/** A finance product's steps, heading and call to action in place of the demo's. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { eyebrow: 'Getting paid', title: 'From invoice to reconciled in four steps', description: 'Set it up once; Ledgerly runs it every time a customer owes you.' },
    steps: [
      { id: 'send', title: 'Send the invoice', description: 'Pick a template, add the lines, and send it by email or link.', media: note('INV-2043 · $3,120.00', 'Sent') },
      { id: 'remind', title: 'Remind on the due date', description: 'A polite note on the day, a firmer one a week later.', media: note('Reminder to Harbor & Pine', 'Scheduled') },
      { id: 'pay', title: 'Take the payment', description: 'Card, bank transfer or wallet, whichever the customer prefers.', media: note('$3,120.00 by bank', 'Received') },
      // A picture can follow the tour: it's given `idle` until the lens arrives, `active` while it plays, then `done`.
      { id: 'match', title: 'Match it in the books', description: 'The payment finds its invoice and the ledger closes itself.', media: (state) => note('INV-2043', state === 'done' ? 'Matched' : state === 'active' ? 'Matching…' : 'Open') },
    ],
    cta: { label: 'Send your first invoice', href: '/invoices/new', onClick: fn() },
    onValueChange: fn(),
  },
}
