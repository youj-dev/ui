import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SetupWizard } from './setup-wizard'
import { sampleDraft } from './setup-wizard/data'

const meta: Meta<typeof SetupWizard> = {
  title: 'Blocks/App/Setup wizard',
  component: SetupWizard,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component: 'Walk someone through a multi-step setup with checks at each step, a review, a saved draft and a finished state.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof SetupWizard>

export const Default: Story = {}

/** Picking up a saved draft with everything filled in: Continue through to the review. */
export const Draft: Story = {
  name: 'Resumed draft',
  args: { draft: sampleDraft() },
}

/** Your own company, choices and words: a freight company adding a driver, sent through your API. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Harbor', logo: 'H' },
    teams: { dispatch: 'Dispatch', longhaul: 'Long haul', local: 'Local delivery', yard: 'Yard' },
    laptops: { tablet: 'Rugged tablet', phone: 'Company phone', byod: 'They’ll use their own phone' },
    accounts: [
      { id: 'slack', label: 'Driver chat', description: 'Joined to their depot’s channel' },
      { id: 'github', label: 'Route planner', description: 'Plans the day’s stops and loads' },
      { id: 'figma', label: 'Fuel card', description: 'Issued for their first shift' },
    ],
    copy: {
      section: 'Drivers',
      title: 'Add a driver',
      description: 'Their licence, depot and kit, ready for their first shift.',
      jobTitlePlaceholder: 'HGV driver',
      laptop: 'Device',
      laptopPlaceholder: 'Choose a device',
      laptopDescription: 'Waiting at their depot on day one.',
      baseAccount: 'Harbor ID',
      accountsDescription: 'Harbor ID is always set up. Add the rest they’ll need.',
      send: 'Add driver',
      sent: 'Driver added',
    },
    onSubmit: fn(),
    onSaveDraft: fn(),
    onViewProfile: fn(),
    onStepChange: fn(),
  },
}
