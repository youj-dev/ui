import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ProductComparison } from './product-comparison'

const meta: Meta<typeof ProductComparison> = {
  title: 'Blocks/Marketing/Product comparison',
  component: ProductComparison,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section', preset: 'graphite' },
    docs: {
      description: {
        component:
          'Put your product beside the alternatives in one table: a sticky head with price, coverage and a call to action, grouped features that explain themselves, a switch for only the differences, and one alternative at a time on a phone.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ProductComparison>

export const Default: Story = {}

/** Only the rows where the products differ. */
export const OnlyDifferences: Story = { args: { defaultDifferencesOnly: true } }

/** Phones show yours and one alternative: this starts on Relay (narrow the frame to see it). */
export const StartsOnRelay: Story = { args: { defaultAlternative: 'relay' } }

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="sr-only">Compare</h1>
      <ProductComparison {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: {
      eyebrow: 'Why switch',
      title: 'Fernhill next to the big marketplaces',
      description: 'What a small shop keeps, and gives up, on each.',
      verified: 'Fees checked in September 2026.',
      picker: 'Compare Fernhill with',
    },
    products: [
      { id: 'fernhill', name: 'Fernhill', tagline: 'Your own shop', price: '€9 / month', cta: { label: 'Open a shop', href: '/signup' } },
      { id: 'marketstall', name: 'Marketstall', tagline: 'A marketplace', price: '€0 + 12% of sales' },
      { id: 'shopbox', name: 'Shopbox', tagline: 'A website builder', price: '€39 / month' },
    ],
    groups: [
      {
        name: 'Selling',
        rows: [
          { feature: 'Your own domain', values: [true, false, true] },
          { feature: 'Customer emails', tip: 'Emails of the people who buy, to keep.', values: [true, false, 'partial'] },
          { feature: 'Card fee', values: [{ text: '1.9%' }, { text: '12%' }, { text: '2.4%' }] },
        ],
      },
      {
        name: 'Running it',
        rows: [
          { feature: 'Set-up time', values: [{ text: '1 hour' }, { text: '10 minutes' }, { text: '2 days' }] },
          { feature: 'Wholesale prices', values: [true, false, false] },
        ],
      },
    ],
    onChoose: fn(),
    onAlternativeChange: fn(),
    onDifferencesOnlyChange: fn(),
  },
}
