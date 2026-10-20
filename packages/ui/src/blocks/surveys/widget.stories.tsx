import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PlaceholderPage } from '../../docs/placeholder-page'
import { SurveyWidget, type Survey } from './widget'

const meta: Meta<typeof SurveyWidget> = {
  title: 'Blocks/Surveys/In-app Widget',
  component: SurveyWidget,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'overlay', address: 'app.tern.io/projects' },
    docs: {
      description: {
        component:
          'A short survey in a corner of your product: it rises in without taking focus, asks one question at a time and keeps one size while it does, folds into a pill and back, and sits along the bottom edge on a phone.',
      },
    },
  },
  // Shown over a stand-in page, as it floats over yours.
  args: { children: <PlaceholderPage /> },
}
export default meta
type Story = StoryObj<typeof SurveyWidget>

export const Default: Story = {}

/** After a low score: the follow-up the score led to. */
export const FollowUp: Story = { name: 'Follow-up', args: { defaultValue: { score: 4 } } }

/** Folded into its pill, which remembers where you were. */
export const Minimized: Story = { args: { defaultMinimized: true } }

/** In the flow of a page, as a preview or in a settings page. */
export const Embedded: Story = {
  args: { embedded: true, children: undefined },
  render: (args) => (
    <div className="grid min-h-dvh place-items-center bg-canvas p-6">
      <SurveyWidget {...args} />
    </div>
  ),
}

const CHECKOUT: Survey = {
  title: 'How was checkout?',
  questions: [
    { id: 'ease', type: 'emoji', points: 3, title: 'How easy was it to pay today?' },
    {
      id: 'hard',
      type: 'choice',
      multiple: true,
      title: 'What got in the way?',
      options: [
        { value: 'shipping', label: 'Shipping costs' },
        { value: 'payment', label: 'My payment method' },
        { value: 'account', label: 'Creating an account' },
      ],
      other: true,
      showIf: { conditions: [{ question: 'ease', op: 'lte', value: 2 }] },
    },
  ],
  ending: { title: 'Thanks', description: 'Your order is on its way.' },
}

/** Your own survey and corner, sent through `onSubmit`, dismissed through `onOpenChange`. */
export const WithYourData: Story = {
  name: 'With your data',
  args: { survey: CHECKOUT, side: 'start', brand: { name: 'Fernhill' }, onSubmit: fn(), onOpenChange: fn(), onValueChange: fn() },
}

const STORE: Survey = {
  title: 'One quick question',
  questions: [{ id: 'found', type: 'yesno', title: 'Did you find everything you were looking for?', labels: ['Yes', 'Not all'] }],
  ending: { title: 'Thanks for shopping with us', description: 'Your order confirmation is in your inbox.' },
}

/** A shop’s single question after checkout, in the shop’s name and words. */
export const StoreCheckoutSurvey: Story = {
  name: 'Store checkout survey',
  args: {
    survey: STORE,
    brand: { name: 'Linden & Co.' },
    copy: { close: 'Close', dismiss: 'Done' },
    onSubmit: fn(),
    onOpenChange: fn(),
  },
}
