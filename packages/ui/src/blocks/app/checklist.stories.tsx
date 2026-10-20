import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { defineTheme } from '@youj/core'
import { Checklist } from './checklist'

const fern = defineTheme({ accent: 'oklch(0.7 0.17 135)' }) // youj-allow: theme accent

const meta: Meta<typeof Checklist> = {
  title: 'Blocks/App/Checklist',
  component: Checklist,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: fern },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Guide your users through setup with a checklist that tracks progress and keeps the next step close.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Checklist>

export const Default: Story = {}

export const AlmostDone: Story = { args: { defaultCompleted: ['workspace', 'repo', 'deploy', 'invite'] } }

export const Minimized: Story = { args: { defaultCompleted: ['workspace', 'repo', 'deploy'], defaultMinimized: true } }

/** Your own steps and words: a store's setup, each step done through your API. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Shopfront' },
    steps: [
      { id: 'catalog', title: 'Import your catalog', description: 'Upload a CSV or connect your old store; we keep variants and images.', action: 'Import products' },
      { id: 'payments', title: 'Turn on payments', description: 'Connect a payout account so orders can be paid.', action: 'Connect payouts' },
      { id: 'shipping', title: 'Set shipping rates', description: 'Flat, weight-based or live carrier rates.', action: 'Add rates' },
      { id: 'launch', title: 'Open your store', description: 'Take the password off and share your link.', action: 'Open store' },
    ],
    defaultCompleted: ['catalog'],
    copy: { pill: 'Setup', allSet: 'Your store is open', allSetBody: () => 'Orders will show up on your dashboard as they come in.' },
    onComplete: fn(),
    onCompletedChange: fn(),
    onMinimizedChange: fn(),
    onDismiss: fn(),
  },
}

/** Opening a physical shop: its own steps, icons and words, a different shape of onboarding from the online one above. */
export const NewStoreSetup: Story = {
  name: 'New store setup',
  args: {
    brand: { name: 'Corner & Co.' },
    steps: [
      { id: 'location', title: 'Pick your location', description: 'Choose the address and opening hours customers will see.', action: 'Set location' },
      { id: 'register', title: 'Set up the register', description: 'Pair the card reader and print a test receipt.', action: 'Pair reader' },
      { id: 'stock', title: 'Stock the first shelf', description: 'Scan your first products to set prices and counts.', action: 'Scan products' },
      { id: 'tax', title: 'Add sales tax', description: 'Enter your local rate so receipts add it up correctly.', action: 'Add tax rate' },
      { id: 'open', title: 'Plan opening day', description: 'Announce it to your list and print the door sign.', action: 'Plan opening' },
    ],
    defaultCompleted: ['location', 'register'],
    copy: {
      region: 'Store setup',
      title: (name) => `Open ${name}`,
      pill: 'Store setup',
      allSet: 'Ready to open',
      allSetBody: (name) => `${name} has a register, shelves and a tax rate. Unlock the door.`,
    },
    onComplete: fn(),
  },
}
