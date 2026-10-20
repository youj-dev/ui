import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PricingPicker } from './pricing-picker'

const meta: Meta<typeof PricingPicker> = {
  title: 'Blocks/Marketing/Pricing picker',
  component: PricingPicker,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section', preset: 'graphite' },
    docs: {
      description: {
        component:
          'Help visitors choose a plan with seat controls and a summary that updates the total as they choose.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof PricingPicker>

export const Default: Story = {}

/** Billed monthly: the summary nudges toward yearly with the saving. */
export const Monthly: Story = { args: { defaultPeriod: 'monthly' } }

/** Hobby: one seat, free, seats locked. */
export const Hobby: Story = { args: { defaultPlan: 'hobby' } }

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="sr-only">Upgrade</h1>
      <PricingPicker {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Fieldnote' },
    currency: 'EUR',
    locale: 'de-DE',
    defaultPlan: 'clinic',
    defaultSeats: 3,
    plans: [
      { id: 'solo', name: 'Solo', blurb: 'One therapist, one calendar.', price: { monthly: 15, yearly: 12 }, singleSeat: true, features: ['Online booking', 'Reminders by SMS'], cta: { label: 'Weiter mit Solo', href: '#solo' } },
      { id: 'clinic', name: 'Clinic', blurb: 'Shared rooms, shared schedule.', price: { monthly: 29, yearly: 24 }, badge: 'Beliebt', features: ['Room planning', 'Invoices', 'Patient notes', 'Team calendar'], cta: { label: 'Weiter mit Clinic', href: '#clinic' } },
    ],
    copy: {
      eyebrow: 'Tarife',
      title: 'Wählen Sie Ihren Tarif.',
      description: 'Pro Behandler:in, monatlich kündbar.',
      monthly: 'Monatlich',
      yearly: 'Jährlich',
      saveBadge: '−17 %',
      perUnit: 'pro Platz / Monat',
      seatsLabel: 'Plätze',
      seatsHint: 'Jede Person mit eigenem Kalender.',
      summaryTitle: 'Bestellübersicht',
      totalLabel: 'Summe pro Monat',
      trialNote: '',
    },
    onSelectPlan: fn(),
    onPlanChange: fn(),
    onSeatsChange: fn(),
    onPeriodChange: fn(),
  },
}
