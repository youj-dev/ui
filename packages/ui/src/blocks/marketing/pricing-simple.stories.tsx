import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PricingSimple } from './pricing-simple'

const meta: Meta<typeof PricingSimple> = {
  title: 'Blocks/Marketing/Pricing simple',
  component: PricingSimple,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section', preset: 'brutal' },
    docs: {
      description: {
        component:
          'Present a single plan with its price, included features and a choice of currencies.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof PricingSimple>

export const Default: Story = {}

/** Priced in euros from the start. */
export const Euros: Story = { args: { defaultCurrency: 'EUR' } }

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="sr-only">Pricing</h1>
      <PricingSimple {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Tidepool' },
    prices: { EUR: 9, CHF: 10 },
    defaultCurrency: 'EUR',
    locale: 'de-DE',
    features: ['Unbegrenzte Kurse', 'Wartelisten', 'Online-Zahlung', 'Erinnerungen per SMS', 'Mitgliedskarten', 'Eigene Domain'],
    reassurances: [{ text: 'Monatlich kündbar.' }, { text: 'Daten in Frankfurt gehostet.' }],
    questions: [{ question: 'Gibt es Gebühren pro Buchung?', answer: 'Nein, nur der Monatspreis.' }],
    cta: { label: '30 Tage testen', href: '#testen', onClick: fn() },
    copy: {
      eyebrow: 'Preis',
      title: 'Ein Preis für die ganze Schwimmschule.',
      description: 'Alles inklusive, ohne Stufen und ohne Aufpreis.',
      perUnit: 'pro Trainer:in im Monat',
      billing: 'Jährlich abgerechnet, inkl. MwSt.',
      ctaNote: 'Keine Kreditkarte nötig.',
      includedTitle: 'Alles inklusive',
      includedDescription: 'Keine Zusatzmodule.',
      currencyLabel: 'Währung',
    },
    onCurrencyChange: fn(),
  },
}
