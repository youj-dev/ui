import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SurveyQuestionCard, type SurveyQuestion } from './question'
import { SURVEY } from './question/data'

const meta: Meta<typeof SurveyQuestionCard> = {
  title: 'Blocks/Surveys/Question',
  component: SurveyQuestionCard,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'One question anywhere in your app, in any type the survey builder offers: a rating under an article, a poll, a check-in after a chat. A pick that needs nothing more sends itself; the thanks rises in where the question was. Its folder is the kit every survey block shares: the definition, its logic and the question renderers.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SurveyQuestionCard>

export const Default: Story = {}

/** Its own page: a centered canvas and an `h1`. */
export const Standalone: Story = { args: { embedded: false } }

/** Every type of question the definition knows, each answered with its own control. */
export const EveryType: Story = {
  name: 'Every type',
  render: (args) => (
    <div className="grid gap-4 p-6 md:grid-cols-2">
      {SURVEY.questions.map((question) => (
        <SurveyQuestionCard key={question.id} {...args} fill question={{ ...question, showIf: undefined }} autoSubmit={false} />
      ))}
    </div>
  ),
}

const POLL: SurveyQuestion = {
  id: 'standup',
  type: 'choice',
  title: 'When should the weekly standup move to?',
  description: 'The team’s calendar opens up on Tuesdays.',
  options: [
    { value: 'tue-930', label: 'Tuesday, 9:30' },
    { value: 'tue-1400', label: 'Tuesday, 14:00' },
    { value: 'wed-1000', label: 'Wednesday, 10:00' },
  ],
  other: true,
}

/** A poll of your own, sent through `onSubmit`, with its strings rewritten in `copy`. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    question: POLL,
    onSubmit: fn(),
    onValueChange: fn(),
    copy: { doneTitle: 'Vote counted', doneDescription: 'We’ll post the result in #team on Friday.', change: 'Change your vote', send: 'Vote' },
  },
}

const LESSON: SurveyQuestion = {
  id: 'lesson',
  type: 'rating',
  title: 'How would you rate today’s lesson on fractions?',
  description: 'Your teacher reads the ratings without names.',
}

/** A school’s one-question check-in after a lesson: a star rating that sends itself, thanked in the class’s words. */
export const CourseFeedback: Story = {
  name: 'Course feedback',
  args: {
    question: LESSON,
    onSubmit: fn(),
    copy: { doneTitle: 'Thanks, that helps', doneDescription: 'Ms. Alvarez adjusts next week’s lesson from what the class says.', change: 'Change your rating', ratingUnit: 'stars' },
  },
}
