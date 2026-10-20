import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { BellIcon, CheckIcon, CreditCardIcon, PlayIcon } from '@youj/icons'
import { Badge } from '../../components/ui/badge'
import { HeroProduct } from './hero-product'

const meta: Meta<typeof HeroProduct> = {
  title: 'Blocks/Marketing/Hero product',
  component: HeroProduct,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section', preset: 'graphite' },
    docs: {
      description: {
        component:
          'Put your product preview at the heart of your landing page with a browser frame beneath the headline.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof HeroProduct>

export const Default: Story = {}

/** Inside another page: a section named by an h2, laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="sr-only">Northwind deployments</h1>
      <HeroProduct {...args} />
    </main>
  ),
}

const PAYOUTS = [
  { who: 'Fernhill Bakery', amount: '$1,240.00', paid: true },
  { who: 'Copperline Studio', amount: '$860.50', paid: true },
  { who: 'Harbor & Pine', amount: '$3,120.00', paid: false },
  { who: 'Oakwell Florists', amount: '$412.00', paid: true },
]

/** A finance product's copy, calls to action, callouts and its own screenshot in place of the demo's. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: {
      badge: 'Beta',
      headline: 'Every invoice, paid and matched.',
      description: 'Ledgerly sends the invoice, nudges on the due date and reconciles the payment when it lands, so your books are always current.',
      url: 'app.ledgerly.com',
      urlPath: '/fernhill/invoices',
    },
    announcement: { label: 'Automatic reminders are here', href: '/changelog' },
    primaryCta: { label: 'Open an account', href: '/signup', onClick: fn() },
    secondaryCta: { label: 'Watch the tour', href: '/tour', icon: <PlayIcon size={15} />, onClick: fn() },
    callouts: [
      { icon: CreditCardIcon, title: 'Card, bank and wallet', description: 'Customers pay the way they like; you see one ledger.' },
      { icon: BellIcon, title: 'Reminders that sound like you', description: 'Polite on the due date, firmer a week later, never awkward.' },
      { icon: CheckIcon, title: 'Matched on arrival', description: 'Payments reconcile to their invoice the moment they land.' },
    ],
    mediaSize: { width: 880, height: 420 },
    media: (
      <div className="flex h-[420px] flex-col gap-4 bg-canvas p-8">
        <p className="text-ui-lg font-semibold">Invoices</p>
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface px-5">
          {PAYOUTS.map((p) => (
            <li key={p.who} className="flex items-center gap-4 py-4">
              <span className="flex-1 text-ui font-medium">{p.who}</span>
              <span className="text-ui tabular-nums">{p.amount}</span>
              <Badge variant={p.paid ? 'success' : 'warning'}>{p.paid ? 'Paid' : 'Due Friday'}</Badge>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
}
