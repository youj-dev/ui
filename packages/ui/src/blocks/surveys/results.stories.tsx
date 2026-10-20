import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SurveyResults, type Survey, type SurveyResponse } from './results'

const meta: Meta<typeof SurveyResults> = {
  title: 'Blocks/Surveys/Results',
  component: SurveyResults,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'What a survey heard: responses, completion and the median time, then any question’s answers in the shape its type calls for, NPS first with its split of detractors, passives and promoters. Computed from the raw responses; the card keeps its size as you move between questions.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SurveyResults>

export const Default: Story = {}

/** Its own page: a centered canvas and an `h1`. */
export const Standalone: Story = { args: { embedded: false } }

/** A multiple choice: each option’s share of the people who answered it. */
export const Choice: Story = { args: { defaultQuestion: 'use' } }

/** Waiting for responses: placeholders in the same shape. */
export const Loading: Story = { args: { loading: true } }

/** Nobody has answered yet. */
export const Empty: Story = { args: { responses: [] } }

const POLL: Survey = {
  title: 'Team offsite',
  questions: [
    {
      id: 'city',
      type: 'choice',
      title: 'Where should we go?',
      options: [
        { value: 'lisbon', label: 'Lisbon' },
        { value: 'copenhagen', label: 'Copenhagen' },
        { value: 'porto', label: 'Porto' },
      ],
    },
    { id: 'excited', type: 'emoji', points: 3, title: 'How excited are you?' },
  ],
}

const VOTES: SurveyResponse[] = ['lisbon', 'lisbon', 'porto', 'copenhagen', 'lisbon', 'porto', 'lisbon'].map((city, i) => ({
  id: `v${i}`,
  answers: { city, excited: (i % 3) + 1 },
  completed: true,
  seconds: 20 + i * 4,
}))

/** Your own survey and responses, with the question shown kept by the app. */
export const WithYourData: Story = {
  name: 'With your data',
  args: { survey: POLL, responses: VOTES, defaultQuestion: 'city', onQuestionChange: fn(), copy: { title: 'Votes so far' } },
}

const SUMMIT: Survey = {
  title: 'Harbor Tech Summit 2026',
  questions: [
    { id: 'nps', type: 'nps', title: 'How likely are you to recommend the summit to a colleague?' },
    { id: 'keynote', type: 'rating', title: 'How was the opening keynote?' },
    {
      id: 'sessions',
      type: 'choice',
      multiple: true,
      title: 'Which tracks did you attend?',
      options: [
        { value: 'ai', label: 'Applied AI' },
        { value: 'security', label: 'Security' },
        { value: 'design', label: 'Design systems' },
        { value: 'platform', label: 'Platform engineering' },
      ],
    },
    { id: 'change', type: 'text', long: true, required: false, title: 'What should we change next year?' },
  ],
}

const SCORES = [1, 0, 1, 2, 3, 5, 6, 12, 20, 26, 24].flatMap((count, score) => Array<number>(count).fill(score))
const TRACKS = ['ai', 'security', 'design', 'platform']
const IDEAS = ['More seats in the Security track.', 'Lunch lines were long; add a second counter.', 'Put the workshops earlier in the day.', 'Share the slides the same afternoon.']
const ATTENDEES: SurveyResponse[] = SCORES.map((score, i) => ({
  id: `a${i + 1}`,
  completed: i % 9 !== 0,
  seconds: 55 + ((i * 17) % 120),
  answers: {
    nps: score,
    keynote: score >= 9 ? 5 - (i % 2) : score >= 7 ? 4 - (i % 2) : 2 + (i % 2),
    sessions: TRACKS.filter((_, k) => (i + k) % 3 !== 0),
    ...(i % 4 === 0 && { change: IDEAS[(i / 4) % IDEAS.length]! }),
  },
}))

/** An event’s attendee survey from the same props: its NPS first, then each question’s answers, with its own wording. */
export const EventSurvey: Story = {
  name: 'Event survey',
  args: { survey: SUMMIT, responses: ATTENDEES, copy: { title: 'Attendee feedback', live: 'Closed', responses: 'Attendees' } },
}
