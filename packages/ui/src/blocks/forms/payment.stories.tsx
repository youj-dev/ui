import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PaymentForm, PAYMENT_COUNTRIES } from './payment'

const meta: Meta<typeof PaymentForm> = {
  title: 'Blocks/Forms/Payment',
  component: PaymentForm,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Payment details in one card: card fields that know their brand and hand focus on as they fill, a billing address in the country’s own order with a lookup on its first line, and a business purchase’s tax number checked in the country’s format.',
      },
    },
  },
  args: { amount: 49 },
}
export default meta
type Story = StoryObj<typeof PaymentForm>

export const Default: Story = {}

/** Its own page: a centered canvas and an `h1`. */
export const Standalone: Story = { args: { embedded: false } }

/** A German address: the postal code before the city, no state, and a VAT number in Germany’s format. */
export const Germany: Story = {
  args: {
    amount: 49,
    currency: 'EUR',
    defaultAddress: { country: 'DE', line1: 'Kastanienallee 12', city: 'Berlin', postal: '10435' },
  },
}

/** Your provider’s card element in the card fields’ place, your countries and brands, and the details sent through `onSubmit`. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    amount: 120,
    currency: 'GBP',
    countries: PAYMENT_COUNTRIES.filter((c) => c.code === 'GB' || c.code === 'NL'),
    brands: ['visa', 'mastercard'],
    card: (
      <div className="grid h-24 place-items-center rounded-md border border-dashed border-line-control px-4 text-center text-ui-sm text-fg-muted">
        Your payment provider’s card element mounts here.
      </div>
    ),
    copy: { title: 'Upgrade to Studio', description: 'Billed yearly. Cancel within 30 days for a full refund.' },
    onSubmit: fn(),
    onAddressChange: fn(),
    onSearchAddress: fn(async () => []),
  },
}

/** The card is declined: the reason is said above Pay, and everything typed is kept. */
export const Declined: Story = {
  args: {
    onSubmit: async () => {
      await new Promise((resolve) => setTimeout(resolve, 900))
      throw new Error('Your card was declined. Your bank didn’t say why; try another card.')
    },
  },
}

/** A nonprofit’s gift: a set amount, a U.S. address for the receipt, and no business purchase or tax number. */
export const DonationCheckout: Story = {
  name: 'Donation checkout',
  args: {
    amount: 50,
    business: false,
    countries: PAYMENT_COUNTRIES.filter((c) => c.code === 'US'),
    brands: ['visa', 'mastercard', 'amex'],
    copy: {
      title: 'Support Riverbend Library',
      description: 'Your gift funds free after-school reading programs. We’ll email a receipt for your taxes.',
      billing: 'Receipt address',
      dueToday: 'Your gift',
      pay: (amount: string) => `Donate ${amount}`,
      paying: 'Sending your gift…',
      paid: 'Thank you',
      failedTitle: 'Your gift didn’t go through',
      failedDescription: 'Nothing was charged. Check the details or try another card.',
      secure: 'Encrypted from your browser to the payment provider. Riverbend Library never sees your card.',
    },
  },
}
