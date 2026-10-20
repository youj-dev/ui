import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SurveyDeck, type Survey } from './deck'

const meta: Meta<typeof SurveyDeck> = {
  title: 'Blocks/Surveys/Card Deck',
  component: SurveyDeck,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', address: 'tern.so/s/help-shape-tern' },
    docs: {
      description: {
        component:
          'A survey for the phone in your hand: a deck of question cards with answers as large as a thumb, thrown aside to go on or back (or moved with the two buttons where the thumb rests), progress in segments along the top, and the cards still ahead peeking out below.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SurveyDeck>

export const Default: Story = {}

/** Past the first card, on a question of faces. */
export const Question: Story = { args: { defaultValue: { role: 'design', use: ['sprints'], score: 8, setup: 6, speed: 4 } } }

/** Inside another page: a panel of a phone's size with an `h2`. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <div className="grid min-h-dvh place-items-center bg-canvas p-6">
      <SurveyDeck {...args} />
    </div>
  ),
}

const EVENT: Survey = {
  title: 'How was Fieldwork 2026?',
  description: 'Three questions while it’s fresh. Swipe to go on.',
  questions: [
    { id: 'overall', type: 'emoji', title: 'How was the day overall?' },
    {
      id: 'best',
      type: 'choice',
      title: 'Which session stayed with you?',
      options: [
        { value: 'keynote', label: 'The opening keynote' },
        { value: 'panel', label: 'The research panel' },
        { value: 'workshop', label: 'The prototyping workshop' },
      ],
    },
    { id: 'again', type: 'yesno', title: 'Would you come back next year?' },
  ],
  ending: { title: 'See you next year', description: 'The talks will be online on Friday.' },
  design: { corners: 'round' },
}

/** Your own survey, branded and sent through `onSubmit`. */
export const WithYourData: Story = {
  name: 'With your data',
  args: { survey: EVENT, brand: { name: 'Fieldwork' }, onSubmit: fn(), onValueChange: fn() },
}
