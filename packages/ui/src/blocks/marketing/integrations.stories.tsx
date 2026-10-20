import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { MarketingIntegrations } from './integrations'

const meta: Meta<typeof MarketingIntegrations> = {
  title: 'Blocks/Marketing/Integrations',
  component: MarketingIntegrations,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Show what your product connects to: searchable, categorised cards with a status each, and a detail sheet for the connection, with its health and sync history.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof MarketingIntegrations>

export const Default: Story = {}

/** A search that finds nothing. */
export const NoResults: Story = { args: { defaultQuery: 'zzz' } }

/** The cards while the list loads. */
export const Loading: Story = { args: { loading: true } }

/** Only the live connections. */
export const ConnectedOnly: Story = { args: { defaultCategory: 'connected' } }

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="sr-only">MarketingIntegrations</h1>
      <MarketingIntegrations {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { eyebrow: 'Works with', title: 'Your shop, wired to everything else', description: 'Send orders to the tools that fulfil, ship and account for them.' },
    integrations: [
      {
        id: 'shipwise',
        name: 'Shipwise',
        category: 'Shipping',
        description: 'Print labels and track parcels from the order page.',
        status: 'connected',
        mark: <path d="M3 8l9-4 9 4v8l-9 4-9-4z" />,
        features: ['Labels in one click', 'Tracking emails to customers'],
        scopes: ['Read orders', 'Write shipments'],
        connection: { account: 'fernhill-shop', connectedBy: 'Ines Duarte', connectedAt: Date.UTC(2026, 1, 12), lastSync: Date.UTC(2026, 8, 29, 8, 40), health: 'healthy' },
      },
      { id: 'ledgerly', name: 'Ledgerly', category: 'Accounting', description: 'Every sale as a journal entry, matched to the payout.', status: 'available', mark: <rect x="4" y="4" width="16" height="16" rx="4" />, features: ['Daily journal entries'], scopes: ['Read orders and payouts'] },
      { id: 'postbox', name: 'Postbox', category: 'Email', description: 'Receipts and abandoned-cart nudges.', status: 'beta', mark: <circle cx="12" cy="12" r="7" /> },
    ],
    onConnect: fn(),
    onDisconnect: fn(),
    onOpen: fn(),
  },
}
