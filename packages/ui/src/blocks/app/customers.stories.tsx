import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { basalt } from '@youj/core'
import { Customers, type CustomerRow } from './customers'

const meta: Meta<typeof Customers> = {
  title: 'Blocks/App/Customers',
  component: Customers,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: basalt },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', preset: 'basalt', address: 'app.tessera.io/customers' },
    docs: {
      description: {
        component:
          'Browse every customer account with health, revenue, seats, usage trends and owners in one grid, then assign, tag or archive them in bulk.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Customers>

export const Default: Story = {}

/** Its own page, for an app without the frame: the top bar over a centered canvas. */
export const Standalone: Story = { args: { embedded: false } }

/** The first load: skeleton rows shaped like each column. */
export const Loading: Story = { args: { loading: true, count: 0 } }

/** A new workspace: the empty state with its import action. */
export const Empty: Story = { args: { count: 0 } }

const clinic = (id: string, name: string, health: CustomerRow['health'], mrr: number, seats: number, renewal: CustomerRow['renewal'], owner: string): CustomerRow => ({
  id,
  name,
  domain: `${id}.dental`,
  plan: mrr > 2000 ? 'Group' : 'Practice',
  health,
  mrr,
  seats,
  seatLimit: 12,
  usage: Array.from({ length: 12 }, (_, i) => seats * (0.6 + (health === 'healthy' ? i : 12 - i) * 0.04)),
  owners: [{ id: owner.toLowerCase(), name: owner }],
  tags: health === 'trial' ? ['beta'] : [],
  region: 'Europe',
  renewsAt: '2026-10-20T00:00:00.000Z',
  renewal,
  lastSeen: '2026-09-28T08:00:00.000Z',
  autoRenew: health !== 'churning',
  contact: { name: 'Dr. Ines Vogel', email: `ines@${id}.dental`, role: 'Practice owner' },
  tickets: 2,
  nps: 48,
})

/** Your accounts, brand and words, with every action handled by your app. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Molar' },
    customers: [
      clinic('lindenhof', 'Lindenhof Zahnärzte', 'healthy', 2480, 11, 'later', 'Jonas Weber'),
      clinic('brightsmile', 'Brightsmile Group', 'at-risk', 3120, 9, 'month', 'Mira Chen'),
      clinic('kastanie', 'Praxis Kastanie', 'trial', 640, 4, 'quarter', 'Priya Raman'),
      clinic('harbour', 'Harbour Dental', 'churning', 410, 3, 'overdue', 'Kenji Sato'),
    ],
    copy: { title: 'Practices', description: 'Every clinic on Molar, how it’s doing, and who looks after it.', section: 'Clinics', period: 'Autumn', create: 'New practice' },
    locale: 'de-DE',
    currency: 'EUR',
    getHref: (row) => `#/practices/${row.id}`,
    onOpen: fn(),
    onEmail: fn(),
    onAssign: fn(),
    onTag: fn(),
    onExport: fn(),
    onArchive: fn(),
    onRestore: fn(),
    onAutoRenewChange: fn(),
    onImport: fn(),
    onCreate: fn(),
    onSelectedChange: fn(),
  },
}
