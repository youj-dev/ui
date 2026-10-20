import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { TestimonialWall } from './testimonial-wall'

const meta: Meta<typeof TestimonialWall> = {
  title: 'Blocks/Marketing/Testimonial wall',
  component: TestimonialWall,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Let customers make the case in their own words: columns of quotes drifting past each other with no seam, a column that stops when pointed at while the others recede, one button to pause the whole wall, and the phrase that matters in each quote set in full ink.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof TestimonialWall>

export const Default: Story = {}

/** Standing still, as under reduced motion: the columns at the wall's height, faded at the foot, with Show all. */
export const Still: Story = { args: { autoplay: false } }

/** The wall while its quotes load. */
export const Loading: Story = { args: { loading: true } }

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="sr-only">Customers</h1>
      <TestimonialWall {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { eyebrow: 'From our kitchen tables', title: 'Cooks who stayed past the first box', description: 'Real notes from subscribers, a few weeks in.' },
    rating: { score: 4.6, count: 812, sources: [{ name: 'App Store', score: 4.7 }] },
    cta: { label: 'Read every review', href: '#reviews', onClick: fn() },
    quotes: [
      { id: 'a', quote: 'The first recipe took twenty minutes and my kids asked for it again the next night.', highlight: 'asked for it again', author: { name: 'Rosa Diaz', role: 'Subscriber since spring' }, rating: 5, source: 'App Store' },
      { id: 'b', quote: 'Skipping a week is one tap. I have never once had to email anyone.', highlight: 'one tap', author: { name: 'Ben Carter', role: 'Two boxes a week' }, source: 'Email' },
      { id: 'c', quote: 'We waste less food than before, and the cards are good enough to keep.', author: { name: 'Mei Chen', role: 'Family of four' }, metric: { value: '−40%', label: 'food thrown away' } },
      { id: 'd', quote: 'Delivery is on time, every time, even in the snow.', highlight: 'even in the snow', author: { name: 'Olu Ade', role: 'Subscriber since winter' }, rating: 5 },
      { id: 'e', quote: 'Finally a box that doesn’t assume I own a mandoline.', author: { name: 'Tom Price', role: 'Cooking for one' }, rating: 4, source: 'App Store' },
      { id: 'f', quote: 'The vegetarian week is the best food I cook all month.', highlight: 'the best food I cook all month', author: { name: 'Lena Fischer', role: 'Vegetarian plan' } },
    ],
  },
}
