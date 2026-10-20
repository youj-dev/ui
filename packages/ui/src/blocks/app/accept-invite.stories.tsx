import type { Meta, StoryObj } from '@storybook/react-vite'
import { AcceptInvite } from './accept-invite'
import { DEMO_INVITE } from './accept-invite/data'

const meta: Meta<typeof AcceptInvite> = {
  title: 'Blocks/App/Accept Invite',
  component: AcceptInvite,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Help new teammates join your workspace with an invitation page that shows who invited them.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof AcceptInvite>

export const Default: Story = {}

export const NewAccount: Story = { args: { defaultMode: 'create' } }

export const Expired: Story = { args: { status: 'expired', invite: { ...DEMO_INVITE, expires: '3 days ago' } } }

export const AlreadyMember: Story = { args: { status: 'member' } }
