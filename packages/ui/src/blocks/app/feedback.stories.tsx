import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn, userEvent, within } from 'storybook/test'
import { graphite } from '@youj/core'
import { BookOpenIcon, LaptopIcon, TimerIcon } from '@youj/icons'
import { PlaceholderPage } from '../../docs/placeholder-page'
import { Feedback } from './feedback'

const meta: Meta<typeof Feedback> = {
  title: 'Blocks/App/Feedback',
  component: Feedback,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'overlay', preset: 'graphite', address: 'app.tern.io/roadmap' },
    docs: {
      description: {
        component:
          'Collect feedback inside your product with a form your users can open when they need it.',
      },
    },
  },
  // Over a stand-in page, as it floats over yours, in the showcase's look (the block itself inherits the app's theme).
  args: { children: <PlaceholderPage />, theme: graphite },
}
export default meta
type Story = StoryObj<typeof Feedback>

/** The NPS survey slides in over the app. */
export const Survey: Story = { args: { delay: 400 } }

/** A passive score: the follow-up asks what would make it a 10. */
export const SurveyAnswered: Story = { args: { delay: 0, defaultScore: 8 } }

/** The floating Feedback button and its popover form. */
export const Widget: Story = { args: { variant: 'widget' } }

/** Sending fails: the form raises an alert and keeps the draft. */
export const WidgetSendFails: Story = {
  args: {
    variant: 'widget',
    onSend: () => new Promise((_, reject) => setTimeout(() => reject(new Error('Offline')), 900)),
  },
}

/** Your product's words and endpoints, over your own page. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    variant: 'widget',
    onSend: fn(async () => 'QRY-1042'),
    onAnswer: fn(),
    onInvite: fn(),
    onSurveyClose: fn(),
    brand: { name: 'Quarry' },
    copy: {
      widgetButton: 'Help us improve',
      formTitle: 'Tell Quarry',
      widgetDescription: (product) => `Goes to the ${product} data team. Replies within a day.`,
      context: 'quarry.app/pipelines · Firefox 131 · Windows',
      kinds: (product) => ({
        bug: { label: 'Problem', prompt: 'What broke?', placeholder: 'Which pipeline, and what did the log say?', sent: 'An engineer will reply by email within a day.' },
        idea: { label: 'Request', prompt: `What should ${product} do?`, placeholder: 'The connector, transform or view you need…', sent: 'We review requests every Friday.' },
        praise: { label: 'Kudos', prompt: 'What’s working?', placeholder: 'Tell the team what saved you time.', sent: 'Passed on to the team. Thank you.' },
      }),
    },
    children: (
      <main className="mx-auto flex max-w-4xl flex-col gap-2 px-6 py-10">
        <h1 className="text-xl font-semibold tracking-tight text-fg">Pipelines</h1>
        <p className="text-ui text-fg-muted">12 pipelines, 3 running. Last sync 4 minutes ago.</p>
      </main>
    ),
  },
}

/** Inside a settings page: a section with an h2, laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="sr-only">Settings</h1>
      <Feedback {...args} />
    </main>
  ),
}

/** A course's feedback form: three kinds about the lesson instead of the product. Props only. */
export const CourseFeedback: Story = {
  name: 'Course feedback',
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement.ownerDocument.body).findByRole('button', { name: 'Rate this lesson' }))
  },
  args: {
    variant: 'widget',
    brand: { name: 'Meridian Academy' },
    onSend: fn(async () => 'MA-3150'),
    copy: {
      widgetButton: 'Rate this lesson',
      formTitle: 'Tell your instructor',
      formDescription: 'Say what to fix, what to slow down and what to keep.',
      widgetDescription: () => 'Goes to the instructor and the course team. We read every note.',
      kindLabel: 'What is your feedback about?',
      context: 'Intro to Statistics · Week 4, Lesson 2',
      kinds: () => ({
        content: { icon: BookOpenIcon, label: 'Content', prompt: 'What was unclear or missing?', placeholder: 'Which example, slide or reading, and what would have helped?', sent: 'Your instructor reads these before the next lesson.' },
        pace: { icon: TimerIcon, label: 'Pace', prompt: 'How did the pace feel?', placeholder: 'Too fast, too slow, or just right? Tell us where it changed.', sent: 'Thanks. We’ll adjust the schedule where we can.' },
        tech: { icon: LaptopIcon, label: 'Tech issue', prompt: 'What stopped working?', placeholder: 'The video, quiz or download, and what you saw on screen.', sent: 'The support team will email you within one school day.' },
      }),
    },
    children: (
      <main className="mx-auto flex max-w-4xl flex-col gap-2 px-6 py-10">
        <h1 className="text-xl font-semibold tracking-tight text-fg">Week 4: Sampling and error</h1>
        <p className="text-ui text-fg-muted">Lesson 2 of 5, 18 minutes. Quiz due Friday, Oct 24.</p>
      </main>
    ),
  },
}
