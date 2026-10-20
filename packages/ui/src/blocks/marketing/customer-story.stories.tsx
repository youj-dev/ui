import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CustomerStory } from './customer-story'

const meta: Meta<typeof CustomerStory> = {
  title: 'Blocks/Marketing/Customer story',
  component: CustomerStory,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Tell a customer story as a long read: the results as counting figures with a before and now bar, the story in chapters with a contents that follows the reader, a pull quote and the next story.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CustomerStory>

export const Default: Story = {}

/** Inside another page: laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="sr-only">Stories</h1>
      <CustomerStory {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    customer: { name: 'Fernhill', industry: 'Coffee', mark: <path d="M12 3c5 3 7 8 0 18C5 11 7 6 12 3z" /> },
    headline: 'How Fernhill went from a stall to 600 cafés',
    summary: 'Roasting to order, with the shop and the roastery on one ledger.',
    facts: [
      { label: 'Founded', value: '2019' },
      { label: 'Team', value: '14 people' },
      { label: 'Based in', value: 'Leeds' },
      { label: 'Uses', value: 'Ledger, payouts' },
    ],
    metrics: [
      { label: 'Orders a week', before: 40, after: 2200 },
      { label: 'Days to get paid', before: 21, after: 3, better: 'down' },
    ],
    chapters: [
      { id: 'start', heading: 'A stall and a spreadsheet', paragraphs: ['Ines roasted on Saturday and invoiced on Monday, when she remembered.'] },
      { id: 'change', heading: 'One ledger for everything', paragraphs: ['Every sale, wholesale order and payout landed in the same place, matched to the bank.'], points: ['Invoices sent on dispatch', 'Payouts matched automatically'] },
      { id: 'now', heading: 'Six hundred cafés later', paragraphs: ['Closing the month takes an afternoon, and nobody opens a spreadsheet to do it.'] },
    ],
    quote: { text: 'I check it before I open the shutters.', name: 'Ines Duarte', role: 'Founder, Fernhill' },
    next: { customer: 'Marlowe', title: 'Marlowe doubled its wholesale in a year', href: '/stories/marlowe', onClick: fn() },
    primaryCta: { label: 'Talk to Ledgerly', href: '/contact', onClick: fn() },
    copy: { ctaTitle: 'Run your shop like Fernhill', ctaDescription: 'Book a call, or open an account today.' },
  },
}
