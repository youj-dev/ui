import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { basalt } from '@youj/core'
import { ListDetail } from './list-detail'

const meta: Meta<typeof ListDetail> = {
  title: 'Blocks/App/List Detail',
  component: ListDetail,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: basalt },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', preset: 'basalt', address: 'app.canopy.so/feedback' },
    docs: {
      description: {
        component:
          'Read feature requests beside the list they come from: move with the arrow keys, drag rows into priority order, resize the panes, and open requests in a drawer on a phone.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof ListDetail>

export const Default: Story = {}

/** Its own page, for an app without the frame: the top bar over full-height panes of requests and the open one. */
export const Standalone: Story = { args: { embedded: false } }

/** Before anything is open: the detail pane shows its illustration and the keys to use. */
export const NothingOpen: Story = { args: { defaultSelected: null } }

const DAY = 86_400_000
const NOW = Date.UTC(2026, 9, 1, 9, 0)

/** A grocery app's roadmap: its own requests, people, wording and handlers. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    now: NOW,
    requests: [
      {
        id: 'idea-12',
        title: 'Recurring deliveries',
        area: 'Checkout',
        status: 'building',
        votes: 312,
        owner: 'Tomás Ruiz',
        quote: { text: 'We order the same produce crate every Monday. Let us set it once.', by: 'Aiko Ito', company: 'Basil & Co' },
        notes: 'Weekly and fortnightly schedules first; skipping a week from the app.',
        askers: [
          { company: 'Basil & Co', plan: 'Pro', arr: 4_800 },
          { company: 'Fjord Café', plan: 'Team', arr: 1_200 },
        ],
        createdAt: NOW - 40 * DAY,
        updatedAt: NOW - DAY,
      },
      {
        id: 'idea-19',
        title: 'Substitution preferences per item',
        area: 'Orders',
        status: 'planned',
        votes: 188,
        owner: 'Nadia Haddad',
        quote: { text: 'If the oat milk is out, never swap it for dairy.', by: 'Ola Berg', company: 'Fjord Café' },
        notes: 'A "no substitute" switch and a preferred alternative per line.',
        askers: [{ company: 'Fjord Café', plan: 'Team', arr: 1_200 }],
        createdAt: NOW - 22 * DAY,
        updatedAt: NOW - 3 * DAY,
      },
      {
        id: 'idea-23',
        title: 'Delivery windows under one hour',
        area: 'Delivery',
        status: 'review',
        votes: 74,
        owner: 'Nadia Haddad',
        quote: { text: 'A four-hour window means someone waits at the door all morning.', by: 'Priya Shah', company: 'Kiln Bakery' },
        notes: 'Depends on the routing upgrade in the spring.',
        askers: [{ company: 'Kiln Bakery', plan: 'Pro', arr: 3_600 }],
        createdAt: NOW - 9 * DAY,
        updatedAt: NOW - 9 * DAY,
      },
    ],
    brand: { name: 'Grocer' },
    locale: 'en-GB',
    currency: 'GBP',
    copy: { title: 'Ideas', section: 'Roadmap', newRequest: 'New idea', search: 'Search ideas' },
    onSelectedChange: fn(),
    onStatusChange: fn(),
    onReorder: fn(),
    onReply: fn(),
    onMerge: fn(),
    onCreate: fn(),
    onRetry: fn(),
  },
}
