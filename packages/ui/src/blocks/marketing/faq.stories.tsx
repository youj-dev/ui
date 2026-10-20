import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Faq } from './faq'

const meta: Meta<typeof Faq> = {
  title: 'Blocks/Marketing/FAQ',
  component: Faq,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Answer common questions like a small help center: a search that marks its words and opens the answer that matched, topics with counts, a deep link for every answer, and “Was this helpful?” under each.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Faq>

export const Default: Story = {
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <Faq {...args} />
    </div>
  ),
}

/** A search in progress: its words marked in questions and answers, the answer that matched in its body opened, and the topics counting what's left. */
export const Searching: Story = {
  args: { defaultQuery: 'region', defaultValue: [] },
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <Faq {...args} />
    </div>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    questions: [
      {
        id: 'shipping',
        topic: 'Orders',
        question: 'How long does shipping take?',
        answer: 'Orders leave our roastery within two working days and arrive in three to five.',
      },
      {
        id: 'tracking',
        topic: 'Orders',
        question: 'Can I track my parcel?',
        answer: 'Yes. The email we send when it leaves has a tracking link, and so does your account.',
      },
      {
        id: 'pause',
        topic: 'Subscriptions',
        question: 'Can I pause my subscription?',
        answer: 'Any time, from your account. Skip a delivery or pause for up to three months.',
      },
      {
        id: 'grind',
        topic: 'Coffee',
        question: 'Is the coffee ground?',
        answer: 'Whole bean by default. Pick a grind for your brewer at checkout.',
        keywords: ['espresso', 'filter', 'cafetiere'],
      },
    ],
    defaultValue: [],
    cta: { label: 'Ask a roaster', href: '/help' },
    copy: { eyebrow: 'Help', title: 'Before you order', description: 'Still unsure? Our roasters reply within a day.', all: 'Everything' },
    onValueChange: fn(),
    onTopicChange: fn(),
    onQueryChange: fn(),
    onFeedback: fn(async () => {}),
  },
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <Faq {...args} />
    </div>
  ),
}
