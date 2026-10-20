import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { AwardIcon, BadgeCheckIcon, MegaphoneIcon, MessageIcon, PackageIcon, ShoppingCartIcon, UndoIcon, UploadIcon } from '@youj/icons'
import { ActivityFeed, type ActivityFeedEvent } from './feed'

const meta: Meta<typeof ActivityFeed> = {
  title: 'Blocks/Activity/Activity feed',
  component: ActivityFeed,
  // The gallery's picture: the demo week, without its Demo data badge.
  args: { demoMarker: false },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A project’s activity by day: one sentence a row, repeats folded together, filters by kind and person, live arrivals that wait while you read, and older pages on demand.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof ActivityFeed>

/** The demo: new events arrive every few seconds. Point at the feed or scroll down and they wait behind a pill. */
export const Default: Story = {}

/** Only comments. */
export const Comments: Story = { args: { defaultFilter: 'comments' } }

/** While the events load. */
export const Loading: Story = { args: { events: [], loading: true } }

/** Nothing has happened yet. */
export const Empty: Story = { args: { events: [] } }

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. */
export const Standalone: Story = { args: { embedded: false } }

const NOW = Date.UTC(2026, 9, 2, 10, 0)
const MIN = 60_000
const LEE = { id: 'lee', name: 'Lee Park' }
const ANA = { id: 'ana', name: 'Ana Ruiz' }
const BOT = { id: 'bot', name: 'Release bot' }
const EVENTS: ActivityFeedEvent[] = [
  {
    id: 'r1',
    type: 'deploy',
    actor: BOT,
    target: { label: 'v4.12 to production' },
    time: NOW - 8 * MIN,
    status: { tone: 'success', label: 'Live in 3 regions' },
  },
  {
    id: 'r2',
    type: 'review',
    actor: ANA,
    target: { label: '#482 Stream CSV exports', href: '#482' },
    time: NOW - 30 * MIN,
    excerpt: 'Looks great, ship it once the flaky test is retried.',
  },
  {
    id: 'r3',
    type: 'commit',
    actor: LEE,
    target: { label: 'release/4.12' },
    time: NOW - 50 * MIN,
    items: [{ id: 'a1b2c3d', label: 'Retry flaky export test' }],
  },
  {
    id: 'r4',
    type: 'commit',
    actor: LEE,
    target: { label: 'release/4.12' },
    time: NOW - 55 * MIN,
    items: [{ id: 'd4e5f6a', label: 'Bump version to 4.12.0' }],
  },
]

/** A release's activity with a type of its own (`review`), your router's links and every load wired. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    events: EVENTS,
    now: NOW,
    live: true,
    hasMore: true,
    onLoadMore: fn(),
    onFilterChange: fn(),
    copy: { title: 'Release 4.12' },
    types: { review: { icon: BadgeCheckIcon, label: 'Review', verb: () => 'approved', tone: 'success' } },
    filters: [
      { id: 'all', label: 'Everything', types: 'all' },
      { id: 'reviews', label: 'Reviews', types: ['review'] },
      { id: 'ship', label: 'Shipping', types: ['commit', 'deploy'] },
    ],
  },
}

const MS_REYES = { id: 'reyes', name: 'Ms. Reyes' }
const NIA = { id: 'nia', name: 'Nia Baptiste' }
const OMAR = { id: 'omar', name: 'Omar Haddad' }
const ELI = { id: 'eli', name: 'Eli Tanaka' }

/** Education: submissions, grades and announcements in a class, with types and filters of its own. */
export const ClassroomActivity: Story = {
  name: 'Classroom activity',
  args: {
    now: NOW,
    demoMarker: false,
    copy: { title: 'Period 3 · Biology' },
    events: [
      {
        id: 'k1',
        type: 'announce',
        actor: MS_REYES,
        target: { label: 'Cell models project' },
        time: NOW - 15 * MIN,
        excerpt: 'Models are due Friday. Bring your materials list to class on Wednesday.',
      },
      {
        id: 'k2',
        type: 'grade',
        actor: MS_REYES,
        target: { label: 'Lab report 4 · Nia Baptiste' },
        time: NOW - 45 * MIN,
        change: { from: 'Not graded', to: '92 / 100' },
      },
      { id: 'k3', type: 'submit', actor: NIA, target: { label: 'Cell models project' }, time: NOW - 70 * MIN },
      { id: 'k4', type: 'submit', actor: OMAR, target: { label: 'Cell models project' }, time: NOW - 80 * MIN },
      { id: 'k5', type: 'submit', actor: ELI, target: { label: 'Cell models project' }, time: NOW - 95 * MIN },
      {
        id: 'k6',
        type: 'comment',
        actor: OMAR,
        target: { label: 'Lab report 4' },
        time: NOW - 26 * 60 * MIN,
        excerpt: 'Can we use last week’s data for the graph?',
      },
    ],
    types: {
      submit: { icon: UploadIcon, label: 'Submission', verb: () => 'turned in', fold: 'people' },
      grade: { icon: AwardIcon, label: 'Grade', verb: () => 'graded', tone: 'success' },
      announce: { icon: MegaphoneIcon, label: 'Announcement', verb: () => 'posted an announcement in', tone: 'accent' },
      comment: { icon: MessageIcon, label: 'Question', verb: () => 'asked about' },
    },
    filters: [
      { id: 'all', label: 'Everything', types: 'all' },
      { id: 'work', label: 'Student work', types: ['submit', 'comment'] },
      { id: 'grades', label: 'Grades', types: ['grade', 'announce'] },
    ],
  },
}

const SHOPPER_A = { id: 'sa', name: 'Priya Nair' }
const SHOPPER_B = { id: 'sb', name: 'Marcus Webb' }
const SHOPPER_C = { id: 'sc', name: 'Hana Ito' }
const STOCKER = { id: 'st', name: 'Dana Whitfield' }

/** Commerce: orders, refunds and restocks for a shop. */
export const StoreActivity: Story = {
  name: 'Store activity',
  args: {
    now: NOW,
    demoMarker: false,
    copy: { title: 'Fernway Goods' },
    events: [
      {
        id: 's1',
        type: 'order',
        actor: SHOPPER_A,
        target: { label: 'Order #5821', href: '#5821' },
        time: NOW - 6 * MIN,
        status: { tone: 'success', label: '$84.50 · Paid' },
      },
      {
        id: 's2',
        type: 'order',
        actor: SHOPPER_B,
        target: { label: 'Order #5820', href: '#5820' },
        time: NOW - 22 * MIN,
        status: { tone: 'success', label: '$129.00 · Paid' },
      },
      {
        id: 's3',
        type: 'refund',
        actor: SHOPPER_C,
        target: { label: 'Order #5812', href: '#5812' },
        time: NOW - 50 * MIN,
        excerpt: 'Arrived with a cracked lid.',
        status: { tone: 'warning', label: '$36.00 refunded' },
      },
      {
        id: 's4',
        type: 'restock',
        actor: STOCKER,
        target: { label: 'Stoneware mug, blue' },
        time: NOW - 28 * 60 * MIN,
        change: { from: '2 in stock', to: '48 in stock' },
      },
    ],
    types: {
      order: { icon: ShoppingCartIcon, label: 'Order', verb: () => 'placed', fold: 'people' },
      refund: { icon: UndoIcon, label: 'Refund', verb: () => 'requested a refund on', tone: 'warning' },
      restock: { icon: PackageIcon, label: 'Restock', verb: () => 'restocked', tone: 'accent' },
    },
    filters: [
      { id: 'all', label: 'All', types: 'all' },
      { id: 'sales', label: 'Sales', types: ['order'] },
      { id: 'issues', label: 'Refunds & stock', types: ['refund', 'restock'] },
    ],
  },
}
