import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Solutions } from './solutions'

const meta: Meta<typeof Solutions> = {
  title: 'Blocks/Marketing/Solutions',
  component: Solutions,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Speak to each buyer on one page: pick a role and an industry, and the pitch, a customer quote, the call to action, the live numbers and the activity feed all change to match.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Solutions>

export const Default: Story = {}

/** Opens on designers in media. */
export const DesignersInMedia: Story = { args: { defaultValue: 'design', defaultIndustry: 'media' } }

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="sr-only">Solutions</h1>
      <Solutions {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { eyebrow: 'Who it is for', title: 'One ledger, three jobs', description: 'Pick your seat at the table.', roleLabel: 'Your job', industryLabel: 'Your business' },
    roles: [
      {
        id: 'owner',
        label: 'Owners',
        headline: 'Know where the money is, today',
        description: 'Cash in the bank, invoices out and what is due this week, on one page, without asking anyone.',
        points: ['A cash view that is never a week old', 'Unpaid invoices chased for you'],
        stats: [
          { label: 'Days to get paid', values: { cafe: { value: 9 }, studio: { value: 21 } } },
          { label: 'Cash runway', values: { cafe: { value: 7, suffix: ' mo' }, studio: { value: 11, suffix: ' mo' } } },
        ],
        feed: { cafe: ['Supplier invoice due Friday', 'Card payout landed: £1,240'], studio: ['Invoice 118 paid by Orbit', 'Retainer renews next week'] },
        cta: { href: '/owners', onClick: fn() },
      },
      {
        id: 'bookkeeper',
        label: 'Bookkeepers',
        headline: 'Close the month on the 1st',
        description: 'Every transaction arrives matched, so the work left is the exceptions.',
        points: ['Bank feeds matched as they land', 'One review queue for every client'],
        stats: [{ label: 'Matched on arrival', values: { cafe: { value: 94, suffix: '%' }, studio: { value: 88, suffix: '%' } } }],
        feed: { cafe: ['12 transactions matched overnight'], studio: ['3 receipts need a category'] },
      },
    ],
    industries: [
      { id: 'cafe', label: 'Cafés', quote: { text: 'I check it before I open the shutters.', name: 'Ines Duarte', role: 'Owner, Café Linden' } },
      { id: 'studio', label: 'Studios', quote: { text: 'Late invoices stopped being my problem.', name: 'Jo Marsh', role: 'Founder, Orbit Design' } },
    ],
    onValueChange: fn(),
    onIndustryChange: fn(),
  },
}
