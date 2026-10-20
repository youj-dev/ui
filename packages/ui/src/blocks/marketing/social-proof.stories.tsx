import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SocialProof } from './social-proof'

const meta: Meta<typeof SocialProof> = {
  title: 'Blocks/Marketing/Social proof',
  component: SocialProof,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Show who else uses your product in one section: a rating summary, customer wordmarks on a hairline grid lit by the pointer with an industry filter, and the featured customer story as an editorial panel whose results roll up.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SocialProof>

export const Default: Story = {}

/** The wall while its data loads. */
export const Loading: Story = { args: { loading: true } }

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="sr-only">Customers</h1>
      <SocialProof {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: {
      eyebrow: 'Our cafés',
      title: 'Poured in 600 cafés across Europe',
      description: 'Roasters, bakeries and bars that serve Fernhill. Open a story to see what changed.',
    },
    logos: [
      { name: 'Café Linden', industry: 'Cafés', mark: <circle cx="12" cy="12" r="7" /> },
      { name: 'Bar Nord', industry: 'Bars', mark: <path d="M4 19 12 5l8 14z" /> },
      { name: 'Brot & Co', industry: 'Bakeries', mark: <rect x="4" y="4" width="16" height="16" rx="4" /> },
      { name: 'Marlowe', industry: 'Cafés', mark: <path d="M4 5h16l-8 14z" /> },
      { name: 'Tidewater', industry: 'Bars', mark: <path d="M3 12c4-6 10-6 18 0-8 6-14 6-18 0z" /> },
      { name: 'Kornhaus', industry: 'Bakeries', mark: <path d="M12 3c5 3 7 8 0 18C5 11 7 6 12 3z" /> },
    ],
    stories: [
      {
        id: 'linden',
        customer: 'Café Linden',
        headline: 'Café Linden sells out of the single-origin by Thursday',
        quote: 'Customers started asking for the farm by name. The roast notes on the bag do half the selling.',
        author: { name: 'Ines Duarte', role: 'Owner, Café Linden' },
        metrics: [
          { value: 3, suffix: '×', label: 'bags sold a week' },
          { value: 41, suffix: '%', label: 'more repeat orders' },
        ],
        href: '/stories/linden',
        onClick: fn(),
      },
    ],
    rating: { score: 4.9, count: 312, distribution: [90, 8, 1, 1, 0], sources: [{ name: 'Google', score: 4.9, count: 312 }] },
    onIndustryChange: fn(),
    onStoryChange: fn(),
  },
}
