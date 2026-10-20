import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PricingCompare } from './pricing-compare'

const meta: Meta<typeof PricingCompare> = {
  title: 'Blocks/Marketing/Pricing compare',
  component: PricingCompare,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section', preset: 'brutal' },
    docs: {
      description: {
        component:
          'Help visitors compare plans with a feature table that keeps prices and sign-up buttons in view.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof PricingCompare>

export const Default: Story = {}

/** Phones show one plan beside the features: this one starts on Scale (narrow the frame to see it). */
export const StartsOnScale: Story = { args: { defaultPlan: 'scale' } }

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="sr-only">Pricing</h1>
      <PricingCompare {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    plans: [
      { id: 'starter', name: 'Starter', price: '€9', per: 'month', cta: { label: 'Open a shop', href: '#signup-starter' } },
      { id: 'growth', name: 'Growth', price: '€29', per: 'month', cta: { label: 'Open a shop', href: '#signup-growth' } },
      { id: 'plus', name: 'Plus', price: '€99', per: 'month', cta: { label: 'Book a demo', href: '#demo' } },
    ],
    recommended: 'growth',
    groups: [
      {
        name: 'Selling',
        rows: [
          { feature: 'Products', tip: 'Items listed in your store at once.', values: ['50', 'Unlimited', 'Unlimited'] },
          { feature: 'Discount codes', values: [false, true, true] },
          { feature: 'Wholesale prices', tip: 'Separate price lists for trade customers.', values: [false, false, true] },
        ],
      },
      {
        name: 'Payments',
        rows: [
          { feature: 'Card fee', values: ['2.9%', '2.4%', '1.9%'] },
          { feature: 'Local payment methods', values: [true, true, true] },
        ],
      },
    ],
    copy: {
      eyebrow: 'Plans',
      title: 'Pick the shop that fits your shelf',
      description: 'Every plan includes hosting, checkout and a free domain for the first year.',
      priceNote: 'Prices include VAT. Cancel any month.',
      recommended: 'Best value',
    },
    onSelectPlan: fn(),
    onPlanChange: fn(),
  },
}
