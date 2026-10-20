import type { Meta, StoryObj } from '@storybook/react-vite'
import { BellIcon, CreditCardIcon, GlobeIcon, ReceiptIcon, WalletIcon, ZapIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { FeatureBento } from './feature-bento'

const meta: Meta<typeof FeatureBento> = {
  title: 'Blocks/Marketing/Feature bento',
  component: FeatureBento,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section', preset: 'graphite' },
    docs: {
      description: {
        component:
          'Show what your product does with a grid of varied tiles and small working demos.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FeatureBento>

export const Default: Story = {}

/** Inside a product page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="sr-only">Northwind platform</h1>
      <FeatureBento {...args} />
    </main>
  ),
}

const chip = (label: string, tone: 'success' | 'warning' | 'secondary' = 'secondary') => (
  <div className="flex h-full min-h-24 items-end rounded-lg bg-transparent p-4">
    <Badge variant={tone}>{label}</Badge>
  </div>
)

/** A finance product's tiles, each with its own picture, and its heading. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { eyebrow: 'Ledgerly', title: 'Getting paid, end to end', description: 'Invoices, reminders, cards and payouts on one ledger that reconciles itself.' },
    features: [
      { icon: ReceiptIcon, title: 'Invoices in a minute', description: 'Templates with your logo and a pay link in every email.', className: 'md:col-span-2 lg:col-span-4 lg:row-span-2', media: chip('INV-2043 · $3,120.00 · Sent') },
      { icon: BellIcon, title: 'Polite reminders', description: 'On the due date, then a firmer note a week later.', className: 'lg:col-span-2', media: chip('Scheduled for Friday') },
      { icon: CreditCardIcon, title: 'Cards for the team', description: 'Limits per person, receipts by text.', className: 'lg:col-span-2', media: chip('$240 of $500', 'warning') },
      { icon: WalletIcon, title: 'Fast payouts', description: 'Money in your account in two business days.', className: 'lg:col-span-2', media: chip('$4,360.50 · Tuesday', 'success') },
      { icon: GlobeIcon, title: 'Twenty currencies', description: 'Invoice abroad at the real exchange rate.', className: 'lg:col-span-2', media: chip('EUR · GBP · JPY') },
      { icon: ZapIcon, title: 'Matched on arrival', description: 'Payments find their invoice by themselves.', className: 'md:col-span-2 lg:col-span-2', media: chip('98% auto-matched', 'success') },
    ],
  },
}
