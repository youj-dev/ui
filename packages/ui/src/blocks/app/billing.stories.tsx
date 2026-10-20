import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { basalt } from '@youj/core'
import { Billing } from './billing'

const meta: Meta<typeof Billing> = {
  title: 'Blocks/App/Billing',
  component: Billing,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: basalt },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', preset: 'basalt', address: 'app.tern.io/settings/billing' },
    docs: {
      description: {
        component:
          'Give your customers a place to manage their plan, payment details and invoices.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Billing>

export const Default: Story = {}

/** Its own page, for an app without the frame: a top bar with the plan badge over a centered canvas. */
export const Standalone: Story = { args: { embedded: false } }

/** Every invoice settled: no payment alert. */
export const AllPaid: Story = { args: { failedPayment: false } }

/** Your own plans, invoices, currency and strings; every action reports to the Actions panel. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Larder' },
    plans: [
      { id: 'kitchen', name: 'Kitchen', blurb: 'One site, daily stock counts', price: 19 },
      { id: 'group', name: 'Group', blurb: 'Every site, supplier ordering', price: 39 },
    ],
    defaultPlan: 'group',
    seats: 6,
    locale: 'en-GB',
    currency: 'GBP',
    card: { brand: 'Mastercard', last4: '5100', expMonth: 3, expYear: 2029, name: 'Priya Shah' },
    invoices: [
      { id: 'l3', number: 'LDR-0031', date: '1 Sep 2026', period: 'Sep 2026', amount: 234, status: 'due' },
      { id: 'l2', number: 'LDR-0030', date: '1 Aug 2026', period: 'Aug 2026', amount: 234, status: 'paid' },
      { id: 'l1', number: 'LDR-0029', date: '1 Jul 2026', period: 'Jul 2026', amount: 195, status: 'paid' },
    ],
    details: { company: 'Larder Kitchens Ltd', email: 'accounts@larder.co.uk', address: '12 Mill Lane, Leeds LS1 4AB', taxId: 'GB 284 1190 73' },
    copy: { description: 'Your subscription, card and invoices.', taxId: 'VAT number', nextInvoiceDate: '1 Oct 2026', renewsDate: '1 Oct 2027' },
    onChangePlan: fn(),
    onUpdatePayment: fn(),
    onRetryPayment: fn(),
    onDownloadInvoice: fn(),
    onSaveDetails: fn(),
  },
}
