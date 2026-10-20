import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { graphite } from '@youj/core'
import { TeamMembers } from './team-members'

const meta: Meta<typeof TeamMembers> = {
  title: 'Blocks/App/Team members',
  component: TeamMembers,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: graphite },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', preset: 'graphite', address: 'app.halyard.dev/settings/members' },
    docs: {
      description: {
        component:
          'Manage workspace members, roles and pending invitations with seat usage in view.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof TeamMembers>

export const Default: Story = {}

/** Its own page, for an app without the frame: a top bar with the plan badge over a centered canvas. */
export const Standalone: Story = { args: { embedded: false } }

/** One seat left: the invite dialog stops a batch that would overrun it. */
export const NearlyFull: Story = { args: { seats: 11 } }

/** Your own crew, roles and strings; every action reports to the Actions panel. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Tidewater Studio' },
    seats: 8,
    members: [
      { id: 't1', name: 'Rafael Ortiz', email: 'rafa@tidewater.studio', role: 'owner', active: 0, you: true },
      { id: 't2', name: 'Hana Sato', email: 'hana@tidewater.studio', role: 'editor', active: 8 },
      { id: 't3', name: 'Felix Braun', email: 'felix@tidewater.studio', role: 'editor', active: 60 * 3 },
      { id: 't4', name: 'Zoe Clarke', email: 'zoe@client-co.com', role: 'client', active: 60 * 24 * 2 },
    ],
    invites: [{ id: 'ti1', email: 'ivy@tidewater.studio', role: 'editor', invitedBy: 'Rafael Ortiz', sent: 5 }],
    roles: [
      { value: 'owner', label: 'Owner', blurb: 'Billing and studio settings.' },
      { value: 'editor', label: 'Editor', blurb: 'Cuts, grades and exports projects.' },
      { value: 'client', label: 'Client', blurb: 'Watches cuts and leaves notes.' },
    ],
    copy: { title: 'Crew', teamHeading: 'Studio crew', invitePeople: 'Add crew', plan: 'Studio plan', breadcrumb: 'Admin' },
    onInvite: fn(),
    onRoleChange: fn(),
    onRemoveMember: fn(),
    onResendInvite: fn(),
    onRevokeInvite: fn(),
  },
}
