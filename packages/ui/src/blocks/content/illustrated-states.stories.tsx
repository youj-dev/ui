import type { Meta, StoryObj } from '@storybook/react-vite'
import { IllustratedState } from './illustrated-states'

const meta: Meta<typeof IllustratedState> = {
  title: 'Blocks/Content/Illustrated states',
  component: IllustratedState,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'fragment' },
    docs: {
      description: {
        component:
          'Give the in-between pages a friendly face: a welcome, an empty workspace, a 404, maintenance, a finished payment and offline, each with a fitting illustration you can swap.',
      },
    },
  },
  argTypes: {
    state: { control: 'inline-radio', options: ['welcome', 'empty', 'not-found', 'maintenance', 'success', 'offline'] },
  },
}
export default meta
type Story = StoryObj<typeof IllustratedState>

export const Welcome: Story = { args: { state: 'welcome' } }
export const EmptyWorkspace: Story = { name: 'Empty workspace', args: { state: 'empty' } }
export const NotFound: Story = { name: 'Not found', args: { state: 'not-found' } }
export const Maintenance: Story = { args: { state: 'maintenance' } }
export const Success: Story = { args: { state: 'success' } }
export const Offline: Story = { args: { state: 'offline' } }

/** `illustration={null}`: the words and the panel alone. */
export const WithoutIllustration: Story = { name: 'Without illustration', args: { state: 'not-found', illustration: null } }

/** A clinic portal's maintenance page, in its own words: the scheduled window and its steps stay the same. */
export const ClinicPortal: Story = {
  name: 'Clinic portal',
  args: {
    state: 'maintenance',
    copy: {
      eyebrow: 'Patient portal maintenance',
      title: 'The portal is resting for a moment',
      body: 'We’re upgrading the patient record system. Appointments and prescriptions are safe, and nothing you sent to your care team is lost.',
      primary: 'Open the status page',
      secondary: 'Text me when it’s back',
    },
  },
}
