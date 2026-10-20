import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { FeatureSpotlight } from './feature-spotlight'

const meta: Meta<typeof FeatureSpotlight> = {
  title: 'Blocks/Marketing/Feature spotlight',
  component: FeatureSpotlight,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          "Show your features in action with alternating text and interactive demos.",
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FeatureSpotlight>

export const Default: Story = {
  render: () => (
    <div className="min-h-dvh bg-canvas">
      <FeatureSpotlight />
    </div>
  ),
}

const card = (title: string, lines: [string, string][]) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ul className="flex flex-col divide-y divide-line">
        {lines.map(([what, value]) => (
          <li key={what} className="flex items-center justify-between gap-3 py-2.5 text-ui">
            {what}
            <span className="tabular-nums text-fg-muted">{value}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
)

/** A finance product's rows, each with its own picture, and its heading and link text. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { eyebrow: 'Ledgerly', title: 'Getting paid, without the paperwork', learnMore: (eyebrow) => `More about ${eyebrow.toLowerCase()}` },
    features: [
      { id: 'invoices', eyebrow: 'Invoices', title: 'Sent in under a minute', description: 'Templates with your logo, line items from your catalogue and a pay link in every email.', href: '/features/invoices', media: card('INV-2043 · Harbor & Pine', [['Design retainer', '$2,800.00'], ['Print run', '$320.00'], ['Total', '$3,120.00']]) },
      { id: 'matching', eyebrow: 'Matching', title: 'Payments that find their invoice', description: 'Money that lands is matched to what it pays for, even two invoices at once.', href: '/features/matching', media: card('Matched today', [['Fernhill Bakery', '$1,240.00'], ['Copperline Studio', '$860.50']]) },
      { id: 'payouts', eyebrow: 'Payouts', title: 'Money in two business days', description: 'Card and bank payments settle to your account on the schedule you pick.', href: '/features/payouts', media: card('Upcoming payouts', [['Tuesday', '$4,360.50'], ['Thursday', '$1,975.00']]) },
    ],
  },
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <FeatureSpotlight {...args} />
    </div>
  ),
}
