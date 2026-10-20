import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SurveyBuilder, type Survey } from './builder'

const meta: Meta<typeof SurveyBuilder> = {
  title: 'Blocks/Surveys/Builder',
  component: SurveyBuilder,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', address: 'app.tern.io/surveys/help-shape-tern' },
    docs: {
      description: {
        component:
          'Build a survey and put it in front of people: an outline you reorder by drag or keyboard, fourteen kinds of question, editing in place with show-if logic, a live preview on a phone or a desktop, design, undo and autosave, a test run in any layout, and Publish to a link, an embed or in-app, with a schedule and a share card.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SurveyBuilder>

export const Default: Story = {}

/** The score's follow-up selected: its show-if logic reads the score. */
export const Logic: Story = { args: { defaultSelected: 'fix' } }

/** A new survey: no questions yet, so the kinds are the way in. */
export const Empty: Story = {
  args: { defaultValue: { title: 'Untitled survey', questions: [] } },
}

/** Already live, with its link; Share opens on the link and the share card. */
export const Live: Story = { args: { publishedUrl: 'https://forms.tern.so/help-shape-tern' } }

const WORKSHOP: Survey = {
  title: 'Workshop feedback',
  description: 'Two minutes, while it’s fresh.',
  questions: [
    { id: 'overall', type: 'rating', title: 'How was the workshop?' },
    {
      id: 'pace',
      type: 'choice',
      title: 'How was the pace?',
      options: [
        { value: 'slow', label: 'Too slow' },
        { value: 'right', label: 'About right' },
        { value: 'fast', label: 'Too fast' },
      ],
    },
    {
      id: 'better',
      type: 'text',
      long: true,
      required: false,
      title: 'What would have made it better?',
      showIf: { conditions: [{ question: 'overall', op: 'lte', value: 3 }] },
    },
  ],
  design: { accent: 'oklch(0.6 0.13 160)', corners: 'round' },
}

/** Your own survey and audiences, saved through `onSave`, published through `onPublish`. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    defaultValue: WORKSHOP,
    segments: [
      { id: 'attendees', label: 'Attendees', people: 86 },
      { id: 'speakers', label: 'Speakers', people: 9 },
    ],
    copy: { surveys: 'Feedback', linkBase: 'forms.fieldwork.events/' },
    onSave: fn(),
    onValueChange: fn(),
    onPublish: fn(async () => ({ url: 'https://forms.fieldwork.events/workshop' })),
  },
}
