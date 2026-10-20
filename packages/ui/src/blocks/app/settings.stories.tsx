import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { NotificationPreferences, Settings } from './settings'

const meta: Meta<typeof Settings> = {
  title: 'Blocks/App/Settings',
  component: Settings,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Bring account, team, billing and notification preferences together in a tabbed settings page.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Settings>

export const Profile: Story = {}

export const Team: Story = { args: { defaultTab: 'team' } }

export const Billing: Story = { args: { defaultTab: 'billing' } }

export const Notifications: Story = { args: { defaultTab: 'notifications' } }

/** Its own page, for an app without the frame: the title over a centered canvas. */
export const Standalone: Story = { args: { embedded: false } }

/** The notifications card on its own: a master Off / On, what to be told about, reminders and channels, saved together. */
export const NotificationPreferencesCard: Story = {
  name: 'Notification preferences',
  parameters: { showcase: { kind: 'card' } },
  render: () => <NotificationPreferences className="mx-auto my-6" onValueChange={fn()} onSave={fn()} />,
}

/** Your own choices and words: a clinic's alerts, with everything muted. */
export const NotificationPreferencesWithYourData: Story = {
  name: 'Notification preferences with your data',
  parameters: { showcase: { kind: 'card' } },
  render: () => (
    <NotificationPreferences
      className="mx-auto my-6"
      defaultValue={{ enabled: false, what: 'urgent', reminders: ['appointments'], channels: ['sms'] }}
      what={[
        { id: 'all', label: 'Every update', description: 'Results, messages and schedule changes.' },
        { id: 'urgent', label: 'Urgent only', description: 'Abnormal results and same-day changes.' },
      ]}
      reminders={[
        { id: 'appointments', label: 'Appointment reminders', description: 'Two days and two hours before.' },
        { id: 'refills', label: 'Prescription refills' },
      ]}
      channels={[
        { id: 'sms', label: 'Text message' },
        { id: 'email', label: 'Email' },
      ]}
      copy={{ title: 'Alerts', description: 'How the clinic reaches you.', how: 'Reach me by', save: 'Save alerts' }}
      onValueChange={fn()}
      onSave={fn()}
    />
  ),
}

/** Your own workspace, people, plans and strings, with a tab of your own; every action reports to the Actions panel. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    defaultTab: 'team',
    brand: { name: 'Fernhill Clinic' },
    user: { name: 'Dr. Imani Okoye', username: 'imani', bio: 'Paediatrics lead. On call Tuesdays.', email: 'imani@fernhill.health', verified: true },
    members: [
      { id: 'u1', name: 'Dr. Imani Okoye', email: 'imani@fernhill.health', role: 'owner' },
      { id: 'u2', name: 'Tomás Herrera', email: 'tomas@fernhill.health', role: 'admin' },
      { id: 'u3', name: 'Lena Fischer', email: 'lena@fernhill.health', role: 'member' },
      { id: 'u4', name: 'reception@fernhill.health', email: 'reception@fernhill.health', role: 'viewer', invited: true },
    ],
    roles: [
      { value: 'owner', label: 'Owner' },
      { value: 'admin', label: 'Practice admin' },
      { value: 'member', label: 'Clinician' },
      { value: 'viewer', label: 'Front desk' },
    ],
    plans: [
      { id: 'solo', name: 'Solo', price: '€29', blurb: 'One clinician.', features: ['Appointments', 'Patient notes'], perMember: true },
      { id: 'practice', name: 'Practice', price: '€49', blurb: 'A whole clinic.', features: ['Shared calendar', 'Billing codes', 'Audit trail'], perMember: true },
      { id: 'network', name: 'Network', price: 'Custom', blurb: 'Many sites.', features: ['SSO', 'Data residency'], contactSales: true },
    ],
    defaultPlan: 'practice',
    paymentMethod: { brand: 'Mastercard', last4: '8811', expires: '11 / 2029' },
    invoices: [{ id: 'FH-2026-09', date: '1 Sep 2026', amount: '€196.00', status: 'open' }],
    sections: ['profile', 'team', 'billing', { id: 'privacy', label: 'Privacy', panel: <p className="text-ui text-fg-muted">Data retention and patient consent live here.</p> }],
    copy: { title: 'Clinic settings', usernamePrefix: 'fernhill.health/', teamTitle: 'Staff', teamTab: 'Staff', teamCount: (n: number) => `${n} staff with access.`, perMember: ' / clinician / month' },
    onTabChange: fn(),
    onSaveProfile: fn(),
    onInvite: fn(),
    onRoleChange: fn(),
    onRemoveMember: fn(),
    onResendInvite: fn(),
    onChangePlan: fn(),
    onContactSales: fn(),
    onUpdatePayment: fn(),
    onDownloadInvoice: fn(),
  },
}
