import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { WhatsNew } from './whats-new'

const meta: Meta<typeof WhatsNew> = {
  title: 'Blocks/Marketing/What’s new',
  component: WhatsNew,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Show that the product keeps moving: the newest change as a feature card, earlier changes as a dated list with kind tags and expandable details, an area filter and a way to load more.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof WhatsNew>

export const Default: Story = {}

/** The list while it loads. */
export const Loading: Story = { args: { loading: true } }

/** With earlier changes to ask for. */
export const WithMore: Story = { args: { hasMore: true, onLoadMore: fn() } }

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="sr-only">Changelog</h1>
      <WhatsNew {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { eyebrow: 'Fresh from the roastery', title: 'What we changed this season', description: 'New beans, better boxes.' },
    now: Date.UTC(2026, 9, 5),
    entries: [
      {
        id: 'autumn',
        date: Date.UTC(2026, 9, 1, 12),
        title: 'The autumn roast is in',
        summary: 'A washed Ethiopian with notes of plum and black tea, roasted lighter than last year.',
        category: 'Beans',
        kind: 'new',
        highlights: ['Roasted to order, shipped within 24 hours', 'Notes of plum, black tea and orange peel'],
        href: '/beans/autumn',
        onClick: fn(),
      },
      { id: 'box', date: Date.UTC(2026, 8, 12, 12), title: 'A smaller box for smaller kitchens', summary: 'The 250 g subscription now fits through a letterbox.', category: 'Subscriptions', kind: 'improved', href: '/box' },
      { id: 'late', date: Date.UTC(2026, 7, 20, 12), title: 'Fixed: delivery dates in the checkout', summary: 'The estimated delivery date now accounts for bank holidays.', category: 'Subscriptions', kind: 'fixed', href: '/late' },
    ],
    subscribeHref: '/feed.xml',
    changelogHref: '/changelog',
    onCategoryChange: fn(),
  },
}
