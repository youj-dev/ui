import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { illustrations } from '@youj/illustrations'
import { Onboarding } from './onboarding'

const meta: Meta<typeof Onboarding> = {
  title: 'Blocks/App/Onboarding',
  component: Onboarding,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', illustration: true },
    docs: {
      description: {
        component:
          'Welcome your users with a guided flow for naming a workspace, choosing a theme and inviting teammates.',
      },
    },
  },
  argTypes: { illustration: { control: 'select', options: illustrations.map((i) => i.id) } },
}
export default meta
type Story = StoryObj<typeof Onboarding>

export const Default: Story = {}

/** Your own product and words: a logistics app's setup, created through your API. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Harbor' },
    illustration: 'delivery',
    defaultValues: { name: 'Harbor Freight Co.' },
    presets: ['graphite', 'terminal', 'brutal'],
    dashboardHref: '#dashboard',
    copy: {
      welcomeDescription: 'Three quick steps and your fleet is on the map: name your company, pick a look, and add your dispatchers.',
      nameTitle: 'Name your company',
      nameLabel: 'Company name',
      namePlaceholder: 'Harbor Freight Co.',
      urlPrefix: 'harbor.app/',
      inviteTitle: 'Add your dispatchers',
      openDashboard: 'Open the dispatch board',
    },
    onFinish: fn(),
    onStepChange: fn(),
    onOpenDashboard: fn(),
  },
}
