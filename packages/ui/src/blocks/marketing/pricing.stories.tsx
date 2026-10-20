import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Pricing } from './pricing'

const meta: Meta<typeof Pricing> = {
  title: 'Blocks/Marketing/Pricing',
  component: Pricing,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          "Help visitors choose a plan with monthly or yearly prices and a feature comparison.",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Pricing>

export const Yearly: Story = {
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <Pricing {...args} />
    </div>
  ),
}

export const Monthly: Story = {
  args: { defaultPeriod: 'monthly' },
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <Pricing {...args} />
    </div>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    defaultPeriod: 'monthly',
    plans: [
      { id: 'solo', name: 'Solo', blurb: 'One photographer, one studio.', price: { monthly: 12, yearly: 10 }, cta: { label: 'Kostenlos testen', href: '/signup?plan=solo' }, features: ['500 client galleries', 'Watermarking', 'Email support'] },
      { id: 'studio', name: 'Studio', blurb: 'A small team sharing one archive.', price: { monthly: 39, yearly: 32 }, cta: { label: 'Testphase starten', href: '/signup?plan=studio' }, featured: true, features: ['Unlimited galleries', 'Client proofing', 'Print store', 'Priority support'] },
    ],
    comparison: [
      {
        group: 'Galleries',
        rows: [
          { feature: 'Client galleries', values: ['500', 'Unlimited'] },
          { feature: 'Client proofing', values: [false, true] },
          { feature: 'Print store', values: [false, true] },
        ],
      },
    ],
    locale: 'de-DE',
    currency: 'EUR',
    copy: {
      eyebrow: 'Preise',
      title: 'Ein Archiv für jedes Shooting.',
      description: 'Monatlich kündbar. Alle Preise zzgl. MwSt.',
      saveBadge: '',
      perUnit: 'pro Monat',
      billedMonthly: 'Monatlich abgerechnet',
      billedYearly: (total: string) => `${total} jährlich abgerechnet`,
      monthly: 'Monatlich',
      yearly: 'Jährlich',
      mostPopular: 'Beliebt',
      compareTitle: 'Pläne vergleichen',
      featureColumn: 'Funktion',
    },
    onSelectPlan: fn(),
    onPeriodChange: fn(),
  },
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <Pricing {...args} />
    </div>
  ),
}
