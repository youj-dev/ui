import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ConversationalSurvey, type Survey } from './conversational'

const meta: Meta<typeof ConversationalSurvey> = {
  title: 'Blocks/Surveys/Conversational',
  component: ConversationalSurvey,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', address: 'tern.so/s/help-shape-tern' },
    docs: {
      description: {
        component:
          'A survey asked one question at a time, keyboard first: letters pick choices, digits pick a point on a scale, Enter goes on. It opens on a welcome, each question fills the screen in large type, logic skips what doesn’t apply and progress counts only the questions this person will be asked, and a review of every answer comes before the send. On a phone the action sits in the thumb’s reach.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ConversationalSurvey>

export const Default: Story = {}

/** Past the welcome, on a question: the score, with its keys in a recessed track. */
export const Question: Story = { args: { defaultValue: { role: 'design', use: ['sprints', 'roadmaps'] } } }

/** Resumed from saved answers: every question is answered, so it opens on the review. */
export const Review: Story = {
  args: {
    defaultValue: {
      role: 'design',
      use: ['sprints', 'roadmaps', 'docs'],
      score: 9,
      love: 'It’s the first tracker my designers open without being asked.',
      setup: 6,
      speed: 4,
      planner: 5,
      value: { cycles: 'very', roadmaps: 'very', insights: 'some' },
      next: ['offline', 'calendar', 'api', 'triage'],
      hours: 12,
      follow: true,
      email: 'ada@northwind.com',
    },
  },
}

/** Inside another page: a card with an `h2`, each question an `h3`. */
export const Embedded: Story = {
  args: { embedded: true, welcome: false },
  render: (args) => (
    <div className="grid min-h-dvh place-items-center bg-canvas p-6">
      <ConversationalSurvey {...args} />
    </div>
  ),
}

const TASTING: Survey = {
  title: 'After your tasting',
  description: 'Four questions for Fernhill Coffee, about a minute.',
  questions: [
    { id: 'rating', type: 'emoji', title: 'How was the tasting?' },
    {
      id: 'favorite',
      type: 'choice',
      title: 'Which coffee would you stock first?',
      options: [
        { value: 'ridge', label: 'Ridge, a washed Ethiopian' },
        { value: 'harbour', label: 'Harbour, the house espresso' },
        { value: 'decaf', label: 'Lowlight, the decaf' },
      ],
      other: true,
    },
    {
      id: 'missing',
      type: 'text',
      long: true,
      required: false,
      title: 'What would you need from us to stock it?',
      showIf: { conditions: [{ question: 'rating', op: 'lte', value: 3 }] },
    },
    { id: 'email', type: 'email', title: 'Where should we send the price list?' },
  ],
  ending: { title: 'Thanks, we’ll be in touch', description: 'The price list is on its way.' },
  design: { corners: 'round', font: 'serif' },
}

/** Your own survey and branching, its design (round corners, a serif for titles), the answers kept by the app and sent through `onSubmit`. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    survey: TASTING,
    brand: { name: 'Fernhill Coffee' },
    copy: { send: 'Send to Fernhill' },
    onSubmit: fn(),
    onValueChange: fn(),
  },
}

/** No review: the last question sends. */
export const WithoutReview: Story = { name: 'Without review', args: { review: false, survey: TASTING, welcome: false } }
