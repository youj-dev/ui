import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PricingUsage } from './pricing-usage'

const meta: Meta<typeof PricingUsage> = {
  title: 'Blocks/Marketing/Pricing usage',
  component: PricingUsage,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section', preset: 'graphite' },
    docs: {
      description: {
        component:
          'Help visitors estimate their bill with usage sliders and a cost breakdown that updates as they drag.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof PricingUsage>

/** A busy Pro team, a little over its allowance. */
export const Default: Story = {}

/** A side project: everything fits the free plan. */
export const FitsHobby: Story = { args: { defaultUsage: { requests: 1_000_000, bandwidth: 0.1, minutes: 500 } } }

/** Heavy traffic: the estimate points at Scale and a conversation. */
export const PointsToScale: Story = { args: { defaultUsage: { requests: 82_000_000, bandwidth: 3.4, minutes: 21_000 } } }

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="sr-only">Pricing</h1>
      <PricingUsage {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    currency: 'EUR',
    locale: 'de-DE',
    basePrice: 49,
    committedFrom: 600,
    meters: [
      { id: 'messages', label: 'Nachrichten', unit: 'im Monat', min: 0, max: 500_000, step: 10_000, free: 10_000, included: 100_000, perStep: 8, rate: '8 € je 10.000', format: { notation: 'compact', compactDisplay: 'long' }, show: (v, locale) => new Intl.NumberFormat(locale).format(v) },
      { id: 'seats', label: 'Agent-Plätze', unit: 'Personen', min: 1, max: 50, step: 1, free: 1, included: 5, perStep: 12, rate: '12 € je Platz', format: {}, show: (v) => String(v) },
    ],
    defaultUsage: { messages: 160_000, seats: 8 },
    plans: {
      free: { id: 'start', name: 'Start', note: 'Passt in den kostenlosen Tarif.', cta: { label: 'Kostenlos starten', href: '#start' } },
      base: { id: 'team', name: 'Team', note: 'Monatliche Abrechnung, jederzeit kündbar.', cta: { label: 'Team testen', href: '#team' } },
      committed: { id: 'konzern', name: 'Konzern', note: 'Ab hier lohnt sich ein fester Vertrag.', cta: { label: 'Vertrieb kontaktieren', href: '#vertrieb' } },
    },
    copy: {
      eyebrow: 'Nutzungspreise',
      title: 'Zahlen Sie nur, was Ihr Support wirklich schreibt',
      description: (plan: string, price: string) => `${plan} kostet ${price} im Monat inklusive Kontingent.`,
      rate: (rate: string, plan: string) => `${rate} über dem ${plan}-Kontingent`,
      allowance: (plan: string, amount: string) => `${plan}: ${amount}`,
      estimateTitle: 'Ihre Schätzung',
      fits: (plan: string) => `Passt zu ${plan}`,
      baseLine: (plan: string) => `${plan}-Grundpreis`,
      total: 'Pro Monat',
    },
    onSelectPlan: fn(),
    onUsageChange: fn(),
  },
}
