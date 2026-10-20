import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SubscriptionCheckout } from './subscription-checkout'

const meta: Meta<typeof SubscriptionCheckout> = {
  title: 'Blocks/Commerce/Subscription Checkout',
  component: SubscriptionCheckout,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Guide your customers from choosing a subscription to payment with a running order summary.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SubscriptionCheckout>

export const Default: Story = {}

export const Monthly: Story = { args: { defaultPeriod: 'monthly', defaultPlan: 'starter', defaultSeats: 1 } }

/** With your data: a design tool's plans in euros for EU countries, its brand, a prefilled buyer and its own promo code; plan changes and the order go to Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Lattice' },
    currency: 'EUR',
    locale: 'de-DE',
    plans: [
      { id: 'solo', name: 'Solo', description: 'One designer, unlimited files.', price: 9, features: ['Unlimited files', 'Version history'] },
      { id: 'studio', name: 'Studio', description: 'Shared libraries for a team.', price: 19, features: ['Everything in Solo', 'Team libraries', 'Branching'], popular: true },
    ],
    defaultPlan: 'studio',
    defaultSeats: 3,
    countries: [
      { code: 'DE', name: 'Deutschland', taxLabel: 'MwSt.', taxRate: 0.19 },
      { code: 'FR', name: 'France', taxLabel: 'TVA', taxRate: 0.2 },
      { code: 'NL', name: 'Nederland', taxLabel: 'BTW', taxRate: 0.21 },
    ],
    defaultPayment: { email: 'mila@lattice.design' },
    promoCodes: { HELLO15: 0.15 },
    copy: { title: 'Upgrade Lattice', subtitle: 'Pick a plan for your team. Cancel any time.' },
    onPlanChange: fn(),
    onPeriodChange: fn(),
    onSeatsChange: fn(),
    onSubscribe: fn(async () => {}),
  },
}
