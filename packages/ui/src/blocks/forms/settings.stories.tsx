import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SettingsForm, type SettingsGroup } from './settings'

const meta: Meta<typeof SettingsForm> = {
  title: 'Blocks/Forms/Settings',
  component: SettingsForm,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A settings section with a save bar: every change is marked with its own Reset, the bar counts them and saves with ⌘S, Discard has Undo, and unsaved changes survive a closing tab or a link elsewhere in the app.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SettingsForm>

export const Default: Story = {}

/** Its own page: a centered canvas and an `h1`. */
export const Standalone: Story = { args: { embedded: false } }

const NOTIFICATIONS: SettingsGroup[] = [
  {
    id: 'email',
    title: 'Email',
    description: 'What lands in your inbox, and how often.',
    fields: [
      { type: 'switch', name: 'mentions', label: 'Mentions and replies', description: 'When someone @mentions you or replies to your comment.' },
      { type: 'switch', name: 'assigned', label: 'Assigned to you', description: 'When a task or a review is given to you.' },
      {
        type: 'segmented',
        name: 'digest',
        label: 'Digest',
        options: [
          { value: 'off', label: 'Off' },
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
        ],
      },
    ],
  },
  {
    id: 'quiet',
    title: 'Quiet hours',
    description: 'Nothing is sent while they last; it waits for the morning.',
    fields: [
      {
        type: 'select',
        name: 'from',
        label: 'From',
        options: ['19:00', '20:00', '21:00', '22:00'].map((time) => ({ value: time, label: time })),
      },
      {
        type: 'select',
        name: 'until',
        label: 'Until',
        options: ['06:00', '07:00', '08:00', '09:00'].map((time) => ({ value: time, label: time })),
      },
      {
        type: 'text',
        name: 'forward',
        label: 'Urgent messages go to',
        description: 'Someone who can answer while you’re away.',
        placeholder: 'name@company.com',
        validate: (value) => (!value || /^\S+@\S+\.\S+$/.test(String(value)) ? undefined : 'Enter an email like name@company.com.'),
      },
    ],
  },
]

/** Your own groups of fields and saved values, saved through `onSave`. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    groups: NOTIFICATIONS,
    defaultValue: { mentions: true, assigned: true, digest: 'weekly', from: '20:00', until: '08:00', forward: '' },
    copy: { title: 'Notifications', description: 'Choose what reaches you, and when.', footer: 'These apply to you only.' },
    onSave: fn(),
    onValueChange: fn(),
    onDirtyChange: fn(),
  },
}

/** The server turns a save down: its message goes under the field it's about, and the bar says why. */
export const ServerError: Story = {
  name: 'Server error',
  args: {
    onSave: async (values) => {
      await new Promise((resolve) => setTimeout(resolve, 700))
      if (values.url !== 'northwind') throw { fields: { url: 'Someone took that URL a moment ago.' }, message: 'One setting needs another look.' }
    },
  },
}

const CLINIC: SettingsGroup[] = [
  {
    id: 'reminders',
    title: 'Appointment reminders',
    description: 'What patients hear before a visit.',
    fields: [
      { type: 'switch', name: 'textReminders', label: 'Text message reminders', description: 'Patients can reply C to confirm or R to reschedule.' },
      {
        type: 'segmented',
        name: 'remindAhead',
        label: 'Send the reminder',
        options: [
          { value: '24h', label: '1 day before' },
          { value: '48h', label: '2 days before' },
          { value: '1w', label: '1 week before' },
        ],
      },
    ],
  },
  {
    id: 'hours',
    title: 'Hours',
    description: 'When the front desk takes bookings.',
    fields: [
      { type: 'select', name: 'opens', label: 'Opens', options: ['7:00 AM', '8:00 AM', '9:00 AM'].map((time) => ({ value: time, label: time })) },
      { type: 'select', name: 'closes', label: 'Closes', options: ['4:00 PM', '5:00 PM', '6:00 PM'].map((time) => ({ value: time, label: time })) },
      {
        type: 'segmented',
        name: 'walkIns',
        label: 'Walk-ins',
        options: [
          { value: 'never', label: 'Never' },
          { value: 'mornings', label: 'Mornings' },
          { value: 'all-day', label: 'All day' },
        ],
      },
    ],
  },
  {
    id: 'intake',
    title: 'Intake forms',
    description: 'What new patients fill in before they arrive.',
    fields: [
      { type: 'switch', name: 'requireIntake', label: 'Require the intake form before a first visit', description: 'Booking stays open; check-in waits for the form.' },
      { type: 'tags', name: 'forms', label: 'Forms to send', description: 'Each is emailed with the booking confirmation.', placeholder: 'Consent form', max: 4 },
      { type: 'textarea', name: 'welcome', label: 'Message to new patients', maxLength: 200, placeholder: 'What to bring and where to park' },
    ],
  },
]

/** A clinic’s preferences from the same props: its own groups, fields, values and words. */
export const ClinicPreferences: Story = {
  name: 'Clinic preferences',
  args: {
    groups: CLINIC,
    defaultValue: {
      textReminders: true,
      remindAhead: '48h',
      opens: '8:00 AM',
      closes: '5:00 PM',
      walkIns: 'mornings',
      requireIntake: true,
      forms: ['Health history', 'Insurance card'],
      welcome: 'Bring a photo ID and your insurance card. Free parking is behind the building.',
    },
    copy: { title: 'Clinic preferences', description: 'Maple Street Family Clinic.', footer: 'Changes apply to every provider at this clinic.' },
  },
}
