import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SurveyForm, type Survey } from './form'

const meta: Meta<typeof SurveyForm> = {
  title: 'Blocks/Surveys/Single Page',
  component: SurveyForm,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', address: 'tern.so/s/help-shape-tern' },
    docs: {
      description: {
        component:
          'A survey on one page: every question numbered in one column, logic revealing and hiding questions in place, progress counting what’s answered, and a send that gathers every problem in a summary linked to each question. The questions scroll under a header that stays, so the page never jumps.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SurveyForm>

export const Default: Story = {}

/** Half answered: the score revealed its follow-up. */
export const InProgress: Story = {
  name: 'In progress',
  args: { defaultValue: { role: 'engineering', use: ['bugs', 'docs'], score: 4, fix: 'Search across workspaces.' } },
}

/** Inside another page: a panel of fixed height with an `h2`. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <div className="grid min-h-dvh place-items-center bg-canvas p-6">
      <div className="w-full max-w-2xl">
        <SurveyForm {...args} />
      </div>
    </div>
  ),
}

const ONBOARDING: Survey = {
  title: 'Tell us about your team',
  description: 'So the workspace starts set up for the way you work.',
  questions: [
    {
      id: 'size',
      type: 'choice',
      title: 'How many people will use Quarry?',
      options: [
        { value: '1', label: 'Just me' },
        { value: '2-10', label: '2 to 10' },
        { value: '11-50', label: '11 to 50' },
        { value: '50+', label: 'More than 50' },
      ],
    },
    {
      id: 'stack',
      type: 'choice',
      multiple: true,
      max: 3,
      title: 'Which warehouses do you load from?',
      options: [
        { value: 'snowflake', label: 'Snowflake' },
        { value: 'bigquery', label: 'BigQuery' },
        { value: 'redshift', label: 'Redshift' },
        { value: 'postgres', label: 'Postgres' },
      ],
      other: true,
    },
    { id: 'sso', type: 'yesno', title: 'Do you sign in with SSO?', showIf: { conditions: [{ question: 'size', op: 'is', value: '50+' }] } },
    { id: 'start', type: 'date', required: false, title: 'When would you like to go live?' },
  ],
  ending: { title: 'Your workspace is ready', description: 'We set it up from your answers. You can change any of it in Settings.' },
}

/** Your own survey and copy, the answers kept by the app and sent through `onSubmit`. */
export const WithYourData: Story = {
  name: 'With your data',
  args: { survey: ONBOARDING, brand: { name: 'Quarry' }, copy: { send: 'Set up my workspace' }, onSubmit: fn(), onValueChange: fn() },
}
