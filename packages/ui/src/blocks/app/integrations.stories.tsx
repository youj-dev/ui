import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { defineTheme } from '@youj/core'
import { IntegrationDetail, Integrations } from './integrations'

const switchboard = defineTheme({ accent: 'oklch(0.58 0.22 290)', radius: 'lg' }) // youj-allow: theme accent

const meta: Meta<typeof Integrations> = {
  title: 'Blocks/App/Integrations',
  component: Integrations,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: switchboard },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Help your users find integrations and review what each one can access before installing it.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Integrations>

export const Default: Story = {}

/** Its own page, for an app without the frame: a brand header, the categories in a column beside the catalog. */
export const Standalone: Story = { args: { embedded: false } }

/** Your own catalog, categories and words: a commerce platform's apps, installed through your API. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Shopfront', logo: 'S' },
    categories: ['Fulfilment', 'Marketing', 'Accounting'],
    integrations: [
      { id: 'parcelpost', name: 'ParcelPost', vendor: 'ParcelPost', category: 'Fulfilment', tone: 'accent', installs: 21_400, verified: true, blurb: 'Print labels and track parcels from every order.', abilities: ['Buy labels at checkout rates', 'Send tracking emails'], permissions: ['Read orders', 'Write fulfilments'] },
      { id: 'stockroom', name: 'Stockroom', vendor: 'Stockroom Ltd.', category: 'Fulfilment', tone: 'ink', installs: 8_900, blurb: 'Sync stock across warehouses and pause items that run out.', abilities: ['Sync inventory levels', 'Hide sold-out items'], permissions: ['Read and write inventory'] },
      { id: 'mailmoth', name: 'Mailmoth', vendor: 'Mailmoth', category: 'Marketing', tone: 'warning', installs: 33_000, verified: true, blurb: 'Abandoned-cart emails and segments built from orders.', abilities: ['Send cart reminders', 'Build segments'], permissions: ['Read customers', 'Read carts'] },
      { id: 'tallybook', name: 'Tallybook', vendor: 'Tallybook', category: 'Accounting', tone: 'success', installs: 5_300, blurb: 'Post every sale, refund and fee to your books.', abilities: ['Post daily summaries', 'Reconcile payouts'], permissions: ['Read orders and payouts'] },
    ],
    featured: { id: 'parcelpost', eyebrow: 'New · return labels', title: 'ParcelPost now prints return labels', description: 'Customers start a return, the label arrives in their inbox.' },
    defaultInstalled: ['mailmoth'],
    copy: { title: 'Apps', description: 'Extend your store with apps.', tagline: 'Commerce', installedCount: 'apps on' },
    onConnect: fn(),
    onDisconnect: fn(),
    onInstalledChange: fn(),
  },
}

/** One connected app as a page: a sample of what it posts, the connection's details with a status menu, and a switch for each permission it holds. */
export const Detail: Story = {
  parameters: { showcase: { kind: 'card' } },
  render: (args) => (
    <IntegrationDetail
      className="p-6"
      theme={args.theme}
      onPermissionChange={fn()}
      onStatusChange={fn()}
    />
  ),
}

/** Your own app, workspace, message and permissions: a paused connection that has never been used. */
export const DetailWithYourData: Story = {
  name: 'Detail with your data',
  parameters: { showcase: { kind: 'card' } },
  render: (args) => (
    <IntegrationDetail
      className="p-6"
      theme={args.theme}
      app={{ id: 'parcelpost', name: 'ParcelPost', vendor: 'ParcelPost', category: 'Fulfilment', tone: 'accent', installs: 21_400, verified: true, blurb: 'Print labels and track parcels from every order.', abilities: [], permissions: [] }}
      connection={{ status: 'paused', workspace: 'Shopfront EU', connectedAt: Date.UTC(2026, 8, 2, 14), lastUsed: null }}
      preview={{ from: 'ParcelPost', title: 'Label ready for order 1042', body: 'Tracking number sent to the customer. Pickup is booked for Thursday.', action: 'Print label' }}
      permissions={[
        { id: 'orders', label: 'Read orders', description: 'Needed to know what to ship.', on: true },
        { id: 'fulfil', label: 'Write fulfilments', description: 'Marks orders as shipped when a label is bought.', on: false },
      ]}
      copy={{ back: 'Apps', previewTitle: 'Example message' }}
      onPermissionChange={fn()}
      onStatusChange={fn()}
    />
  ),
}
