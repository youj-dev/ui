import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ArrowLeftRightIcon, CalendarIcon, FlaskIcon, MailIcon, RepeatIcon } from '@youj/icons'
import { ActivityInbox, type ActivityInboxNotification } from './inbox'

const meta: Meta<typeof ActivityInbox> = {
  title: 'Blocks/Activity/Inbox',
  component: ActivityInbox,
  // The gallery's picture: the demo inbox, without its Demo data badge.
  args: { demoMarker: false },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A notifications triage panel: threads bundled into one row, approve, decline and reply in place, snooze and done with Undo, and every move a key.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof ActivityInbox>

/** The demo: a reply joins the launch thread a few seconds in, then an invitation arrives. Try J and K, E, S and R. */
export const Default: Story = {}

/** What's snoozed, with when each comes back. */
export const Snoozed: Story = { args: { defaultTab: 'snoozed' } }

/** Inbox zero. */
export const Empty: Story = { args: { notifications: [] } }

/** While the notifications load. */
export const Loading: Story = { args: { notifications: [], loading: true } }

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. */
export const Standalone: Story = { args: { embedded: false } }

const NOW = Date.UTC(2026, 9, 2, 10, 0)
const ANA = { id: 'ana', name: 'Ana Ruiz', handle: 'ana' }
const LEE = { id: 'lee', name: 'Lee Park', handle: 'lee' }
const NOTIFICATIONS: ActivityInboxNotification[] = [
  {
    id: 'q-1',
    kind: 'reply',
    actors: [ANA, LEE],
    action: 'replied to',
    subject: { label: 'Refund for order #1042', href: '#1042', context: 'Support · Priority' },
    time: NOW - 6 * 60_000,
    count: 2,
    preview: 'The customer confirmed the duplicate charge. @lee can you refund one?',
    replyable: true,
  },
  {
    id: 'q-2',
    kind: 'access',
    actors: [LEE],
    action: 'asked to approve a refund of',
    subject: { label: '€84.00', context: 'Order #1042' },
    time: NOW - 20 * 60_000,
    actions: [
      { id: 'approve', label: 'Approve', done: 'Refund approved' },
      { id: 'reject', label: 'Reject', done: 'Refund rejected', variant: 'outline' },
    ],
  },
]

/** A support team's inbox: your notifications and people, your clock, every action wired. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    notifications: NOTIFICATIONS,
    people: [ANA, LEE],
    user: ANA,
    now: NOW,
    copy: { title: 'Support inbox' },
    onOpen: fn(),
    onMarkRead: fn(),
    onMarkAllRead: fn(),
    onDone: fn(),
    onSnooze: fn(),
    onAction: fn(),
    onReply: fn(),
  },
}

const DR_OKAFOR = { id: 'okafor', name: 'Dr. Amara Okafor', handle: 'amara' }
const NURSE_LIM = { id: 'lim', name: 'Jesse Lim', handle: 'jesse' }
const FRONT = { id: 'front', name: 'Front desk', handle: 'front' }
const LAB = { id: 'lab', name: 'Riverside Lab', handle: 'lab' }

/** Health: lab results, refill requests to approve or decline, and messages. */
export const ClinicInbox: Story = {
  name: 'Clinic inbox',
  args: {
    now: NOW,
    user: DR_OKAFOR,
    people: [DR_OKAFOR, NURSE_LIM, FRONT],
    copy: { title: 'Clinic inbox', emptyDescription: 'New results, refill requests and patient messages land here.' },
    kinds: { result: { icon: FlaskIcon, tone: 'accent' }, refill: { icon: RepeatIcon, tone: 'warning' }, message: { icon: MailIcon } },
    notifications: [
      {
        id: 'c-1',
        kind: 'refill',
        actors: [NURSE_LIM],
        action: 'requested a refill for',
        subject: { label: 'Lisinopril 10 mg', context: 'Patient · Ruth Calloway' },
        time: NOW - 9 * 60_000,
        actions: [
          { id: 'approve', label: 'Approve', done: 'Refill approved' },
          { id: 'decline', label: 'Decline', done: 'Refill declined', variant: 'outline' },
        ],
      },
      {
        id: 'c-2',
        kind: 'result',
        actors: [LAB],
        action: 'posted results for',
        subject: { label: 'Lipid panel', context: 'Patient · Marcus Webb' },
        time: NOW - 35 * 60_000,
        preview: 'LDL **118 mg/dL**, HDL 54 mg/dL. Within the target range.',
      },
      {
        id: 'c-3',
        kind: 'message',
        actors: [FRONT],
        action: 'sent a message about',
        subject: { label: 'Rescheduling Thursday', context: 'Patient · Hana Ito' },
        time: NOW - 70 * 60_000,
        preview: 'She can come Friday at 9:30 AM instead. Is that okay, @amara?',
        mention: true,
        replyable: true,
      },
      {
        id: 'c-4',
        kind: 'refill',
        actors: [NURSE_LIM],
        action: 'requested a refill for',
        subject: { label: 'Metformin 500 mg', context: 'Patient · Owen Fischer' },
        time: NOW - 3 * 60 * 60_000,
        read: true,
        actions: [
          { id: 'approve', label: 'Approve', done: 'Refill approved' },
          { id: 'decline', label: 'Decline', done: 'Refill declined', variant: 'outline' },
        ],
      },
    ],
    onAction: fn(),
  },
}

const COORD = { id: 'coord', name: 'Beth Ostrowski', handle: 'beth' }
const VOL_A = { id: 'va', name: 'Carlos Mendes', handle: 'carlos' }
const VOL_B = { id: 'vb', name: 'Yuki Sato', handle: 'yuki' }
const VOL_C = { id: 'vc', name: 'Femi Adeyemi', handle: 'femi' }

/** Nonprofit: shift swaps for a coordinator to approve. */
export const VolunteerRequests: Story = {
  name: 'Volunteer requests',
  args: {
    now: NOW,
    user: COORD,
    people: [COORD, VOL_A, VOL_B, VOL_C],
    copy: { title: 'Volunteer requests', emptyTitle: 'No requests waiting', emptyDescription: 'Shift swaps and sign-ups land here.' },
    kinds: { swap: { icon: ArrowLeftRightIcon, tone: 'accent' }, signup: { icon: CalendarIcon }, message: { icon: MailIcon } },
    notifications: [
      {
        id: 'v-1',
        kind: 'swap',
        actors: [VOL_A],
        action: 'asked to swap shifts for',
        subject: { label: 'Saturday food pantry', context: 'Sat, Oct 4 · 9:00 AM' },
        time: NOW - 12 * 60_000,
        preview: 'Yuki can cover my 9:00 AM shift if I take her Sunday delivery.',
        actions: [
          { id: 'approve', label: 'Approve swap', done: 'Swap approved' },
          { id: 'decline', label: 'Decline', done: 'Swap declined', variant: 'outline' },
        ],
      },
      {
        id: 'v-2',
        kind: 'swap',
        actors: [VOL_C],
        action: 'asked to give up',
        subject: { label: 'Tuesday meal prep', context: 'Tue, Oct 7 · 4:00 PM' },
        time: NOW - 55 * 60_000,
        actions: [
          { id: 'approve', label: 'Release shift', done: 'Shift released' },
          { id: 'decline', label: 'Keep with Femi', done: 'Kept', variant: 'outline' },
        ],
      },
      {
        id: 'v-3',
        kind: 'signup',
        actors: [VOL_B, VOL_C],
        action: 'signed up for',
        subject: { label: 'Coat drive sorting', context: 'Sat, Oct 11 · 1:00 PM' },
        time: NOW - 4 * 60 * 60_000,
        read: true,
      },
      {
        id: 'v-4',
        kind: 'message',
        actors: [VOL_B],
        action: 'wrote about',
        subject: { label: 'Parking at the warehouse' },
        time: NOW - 5 * 60 * 60_000,
        preview: 'Is the east lot open on weekends? @beth',
        mention: true,
        replyable: true,
      },
    ],
    onAction: fn(),
  },
}
