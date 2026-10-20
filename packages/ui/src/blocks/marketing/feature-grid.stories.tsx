import type { Meta, StoryObj } from '@storybook/react-vite'
import { BellIcon, CreditCardIcon, FileTextIcon, GlobeIcon, LockIcon, RepeatIcon, type IconProps } from '@youj/icons'
import type { ComponentType } from 'react'
import { cn } from '../../lib/utils'
import { FeatureGrid } from './feature-grid'

const meta: Meta<typeof FeatureGrid> = {
  title: 'Blocks/Marketing/Feature grid',
  component: FeatureGrid,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'List your features in a ruled grid, each read off a live instrument that takes a new reading when it’s pointed at.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FeatureGrid>

export const Default: Story = {}

/** Inside a product page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="sr-only">Northwind platform</h1>
      <FeatureGrid {...args} />
    </main>
  ),
}

const glyph = (Icon: ComponentType<IconProps>) => (live: boolean) => (
  <Icon size={48} strokeWidth={1.5} className={cn('transition-colors yj-duration-base ease-standard', live ? 'text-accent' : 'text-fg-muted')} />
)

/** A finance product's features, each with its own picture, and its heading. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { eyebrow: 'Ledgerly', title: 'Everything month end needs', description: 'The jobs an accountant used to do on the last Friday, done as the money moves.' },
    features: [
      { id: 'matching', title: 'Automatic matching', description: 'Every payment finds its invoice, even when the amount is a cent off.', href: '/features/matching', media: glyph(RepeatIcon) },
      { id: 'cards', title: 'Cards for the team', description: 'Issue a card per person with its own limit, and receipts by text.', href: '/features/cards', media: glyph(CreditCardIcon) },
      { id: 'reminders', title: 'Gentle reminders', description: 'Overdue invoices nudge themselves, politely and then firmly.', href: '/features/reminders', media: glyph(BellIcon) },
      { id: 'tax', title: 'Tax, drafted', description: 'Quarterly returns are prepared from the ledger, ready to review.', href: '/features/tax', media: glyph(FileTextIcon) },
      { id: 'currencies', title: 'Twenty currencies', description: 'Invoice abroad and get paid at the real exchange rate.', href: '/features/currencies', media: glyph(GlobeIcon) },
      { id: 'audit', title: 'An audit trail', description: 'Every change to the books is signed, dated and reversible.', href: '/features/audit', media: glyph(LockIcon) },
    ],
  },
}
