import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SupportRequest, type SupportTopic } from './support'

const meta: Meta<typeof SupportRequest> = {
  title: 'Blocks/Forms/Support request',
  component: SupportRequest,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A support request that helps before it’s sent: the topic decides the fields, help articles appear while the subject is typed, files upload with progress, and the reply time follows the team’s real hours in the requester’s own clock.',
      },
    },
  },
  args: { defaultTopic: 'bug', now: new Date(2026, 9, 8, 14, 20) },
}
export default meta
type Story = StoryObj<typeof SupportRequest>

export const Default: Story = {}

/** Its own page: a centered canvas and an `h1`. */
export const Standalone: Story = { args: { embedded: false } }

/** Signed out: the reply needs an address, and it’s Saturday, so the team is away until Monday. */
export const SignedOut: Story = { name: 'Signed out', args: { user: null, defaultTopic: undefined, now: new Date(2026, 9, 10, 11, 5) } }

const TOPICS: SupportTopic[] = [
  {
    id: 'order',
    label: 'An order',
    description: 'Late, wrong or damaged',
    fields: [
      { id: 'order', label: 'Order number', type: 'text', required: true, placeholder: 'FH-10294' },
      {
        id: 'issue',
        label: 'What went wrong?',
        type: 'segmented',
        defaultValue: 'late',
        options: [
          { value: 'late', label: 'It’s late' },
          { value: 'wrong', label: 'Wrong item' },
          { value: 'damaged', label: 'Damaged', replyHours: 2 },
        ],
      },
    ],
  },
  { id: 'wholesale', label: 'Wholesale', description: 'Stocking our coffee', replyHours: 24 },
  { id: 'other', label: 'Something else' },
]

/** Your topics and fields, your team’s hours and your help center, sent through `onSubmit`. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    topics: TOPICS,
    defaultTopic: 'order',
    hours: { timeZone: 'Europe/London', days: [1, 2, 3, 4, 5, 6], open: 8, close: 17 },
    replyHours: 6,
    user: { name: 'Jo Marsh', email: 'jo@fernhill.coffee' },
    copy: { title: 'Ask Fernhill', description: 'Our roasters answer, not a bot.' },
    onSearchArticles: fn(async () => []),
    onSubmit: fn(async () => 'FH-881'),
    requestsHref: '#requests',
  },
}

const HELP_DESK: SupportTopic[] = [
  {
    id: 'hardware',
    label: 'Hardware',
    description: 'Laptops, monitors, badges',
    diagnostics: true,
    subjectPlaceholder: 'My docking station stopped charging the laptop',
    fields: [
      { id: 'asset', label: 'Asset tag', type: 'text', placeholder: 'BW-20418', description: 'The sticker on the underside of the device.' },
      {
        id: 'urgency',
        label: 'How urgent is it?',
        type: 'segmented',
        defaultValue: 'soon',
        options: [
          { value: 'soon', label: 'This week' },
          { value: 'today', label: 'Today', replyHours: 2 },
          { value: 'down', label: 'I can’t work', replyHours: 1 },
        ],
      },
    ],
  },
  {
    id: 'access',
    label: 'Access',
    description: 'Passwords, VPN, shared drives',
    replyHours: 2,
    subjectPlaceholder: 'I can’t open the Finance shared drive',
    fields: [
      {
        id: 'system',
        label: 'What do you need access to?',
        type: 'select',
        required: true,
        options: [
          { value: 'vpn', label: 'VPN' },
          { value: 'drive', label: 'A shared drive' },
          { value: 'email', label: 'Email or calendar' },
          { value: 'app', label: 'A business app' },
        ],
      },
    ],
  },
  { id: 'software', label: 'Software', description: 'Installs, licenses, updates', replyHours: 8, subjectPlaceholder: 'I need a license for the design tools' },
]

/** An internal IT desk from the same props: its own topics, office hours, signed-in employee and wording. */
export const ITHelpDesk: Story = {
  name: 'IT help desk',
  args: {
    topics: HELP_DESK,
    defaultTopic: 'hardware',
    // Thursday 12:20 in Chicago: the desk is in.
    now: new Date(Date.UTC(2026, 9, 8, 17, 20)),
    hours: { timeZone: 'America/Chicago', days: [1, 2, 3, 4, 5], open: 8, close: 17 },
    replyHours: 4,
    user: { name: 'Priya Nair', email: 'priya.nair@brightwell.example' },
    diagnostics: { device: 'MacBook Pro 14-inch' },
    copy: {
      title: 'IT help desk',
      description: 'Brightwell IT answers every ticket. For an outage, call extension 4000.',
      topic: 'What do you need?',
      message: 'What’s going on?',
      messagePlaceholder: 'What you were doing, what you expected, and what happened instead.',
      attachmentsTitle: 'Add screenshots or error messages',
      diagnostics: 'Include my device details',
      send: 'Open ticket',
      sending: 'Opening…',
      sent: 'Opened',
      failedTitle: 'Your ticket didn’t open',
      doneTitle: (id?: string) => (id ? `Ticket ${id} is with IT` : 'Your ticket is with IT'),
      another: 'Open another ticket',
      requests: 'See your tickets',
    },
    onSubmit: fn(async () => 'IT-4417'),
    requestsHref: '#tickets',
  },
}
