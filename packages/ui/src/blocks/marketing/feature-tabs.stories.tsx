import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { BellIcon, CreditCardIcon, ReceiptIcon, WalletIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { FeatureTabs } from './feature-tabs'

const meta: Meta<typeof FeatureTabs> = {
  title: 'Blocks/Marketing/Feature tabs',
  component: FeatureTabs,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section', preset: 'graphite' },
    docs: {
      description: {
        component:
          'Let visitors explore your features in tabs with a large demo for each choice.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FeatureTabs>

export const Default: Story = {}

/** Opened on the trace waterfall, with the tour off. */
export const Traces: Story = { args: { defaultValue: 'traces', autoAdvance: false } }

/** Inside a product page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="sr-only">Northwind observability</h1>
      <FeatureTabs {...args} />
    </main>
  ),
}

const rows = (items: [string, string, 'success' | 'warning' | 'secondary'][]) => (
  <ul className="flex h-full flex-col divide-y divide-line rounded-lg border border-line bg-surface px-4">
    {items.map(([what, status, tone]) => (
      <li key={what} className="flex items-center justify-between gap-3 py-3 text-ui">
        {what}
        <Badge variant={tone}>{status}</Badge>
      </li>
    ))}
  </ul>
)

/** A finance product's features, each with its own panel picture, reporting the open tab. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: {
      eyebrow: 'Ledgerly',
      title: 'Every part of getting paid, in one place',
      description: 'Invoices, reminders, cards and payouts share one ledger, so nothing is entered twice.',
      listLabel: 'Ledgerly features',
    },
    features: [
      { id: 'invoices', icon: ReceiptIcon, title: 'Invoices', tagline: 'Sent in under a minute', description: 'Templates with your logo, line items from your catalogue, and a pay link in every email.', media: rows([['INV-2041 · Fernhill Bakery', 'Paid', 'success'], ['INV-2042 · Copperline Studio', 'Paid', 'success'], ['INV-2043 · Harbor & Pine', 'Due Friday', 'warning']]) },
      { id: 'reminders', icon: BellIcon, title: 'Reminders', tagline: 'Paid on time, politely', description: 'A friendly note on the due date and a firmer one a week later, in your voice.', media: rows([['Harbor & Pine · due date', 'Scheduled', 'secondary'], ['Oakwell · one week late', 'Sent', 'success']]) },
      { id: 'cards', icon: CreditCardIcon, title: 'Cards', tagline: 'A card for every teammate', description: 'Per-person limits, receipts by text message, and spending that lands in the right category.', media: rows([['Maya · software', '$240 / $500', 'secondary'], ['Theo · travel', '$1,120 / $2,000', 'secondary']]) },
      { id: 'payouts', icon: WalletIcon, title: 'Payouts', tagline: 'Money in two business days', description: 'Card and bank payments settle to your account on a schedule you choose.', media: rows([['Tuesday payout', '$4,360.50', 'success'], ['Thursday payout', 'Pending', 'warning']]) },
    ],
    defaultValue: 'invoices',
    onValueChange: fn(),
  },
}
