import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { About } from './about'

const meta: Meta<typeof About> = {
  title: 'Blocks/Marketing/About',
  component: About,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Tell the company’s story as something to scrub through: a rail of years under a growth line, where each year rolls the figures to how they stood and swaps the chapter in. It plays once in view; then the values.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof About>

export const Default: Story = {}

/** The story at rest on today, for a page that shouldn't move on its own. */
export const AtRest: Story = { name: 'At rest', args: { autoAdvance: false } }

/** Inside another page: a section laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="sr-only">About</h1>
      <About {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: {
      eyebrow: 'Our story',
      mission: 'A small roastery that takes its beans personally.',
      description: 'Fernhill began on a market stall in Leeds. Today we roast for 600 cafés, and we still know the farmers by name.',
      timeline: 'Fernhill, from the first roast',
      valuesTitle: 'How we roast',
    },
    metrics: [
      { id: 'people', label: 'Roasters' },
      { id: 'cafes', label: 'Cafés pouring it', chart: true },
      { id: 'farms', label: 'Farms we buy from' },
    ],
    milestones: [
      {
        label: '2019',
        title: 'A stall and a sample roaster',
        description: 'Saturday mornings at Kirkgate Market, a kilo at a time.',
        figures: { people: 1, cafes: 0, farms: 2 },
      },
      {
        label: '2021',
        title: 'The first wholesale order',
        description: 'A café down the road asks for ten kilos a week, then thirty.',
        figures: { people: 4, cafes: 40, farms: 6 },
      },
      {
        label: '2023',
        title: 'A roastery of our own',
        description: 'A railway arch, a 15-kilo drum and a tasting table.',
        figures: { people: 9, cafes: 280, farms: 11 },
      },
      {
        label: 'Today',
        title: 'Six hundred cafés',
        description: 'Still roasted to order, still delivered on our own bikes in town.',
        figures: { people: 14, cafes: 600, farms: 15 },
      },
    ],
    values: [
      { title: 'Know the farm', description: 'Every bag names the farmer, the altitude and the harvest.' },
      { title: 'Roast to order', description: 'Nothing sits on a shelf. If it is on your table it was roasted this week.' },
      { title: 'Pay first', description: 'Farmers are paid on delivery, at prices we publish.' },
    ],
    onValueChange: fn(),
  },
}
