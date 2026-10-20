import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { basalt, graphite } from '@youj/core'
import { RecordDrawer, type RecordDrawerDeal } from './record-drawer'

const meta: Meta<typeof RecordDrawer> = {
  title: 'Blocks/App/Record Drawer',
  component: RecordDrawer,
  // The showcase's look: the block itself inherits the app's theme.
  args: { theme: basalt, defaultValue: 'deal-05' },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', preset: 'basalt', address: 'app.halyard.io/deals' },
    docs: {
      description: {
        component:
          'Open a deal from the pipeline in a floating drawer over the list: its owner, stage, odds, dates and value, then its meetings, progress, notes and activity. Step through the rows with ↓ and ↑ (or J and K) without closing it.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof RecordDrawer>

/** Basalt: the fifth deal open over the dimmed, blurred list. */
export const Default: Story = {}

/** Its own page, for an app without the frame: the top bar over a centered canvas of the pipeline, a deal open in the drawer. */
export const Standalone: Story = { args: { embedded: false } }

/** Graphite, light. */
export const Light: Story = { args: { theme: graphite } }

/** Nothing open: the list alone. Press a row to open its drawer. */
export const Closed: Story = { args: { defaultValue: null } }

const person = (id: string, name: string) => ({ id, name })
const ana = person('ana', 'Ana Ruiz')
const jun = person('jun', 'Jun Park')
const listing = (id: string, company: string, name: string, stage: RecordDrawerDeal['stage'], probability: number, value: number): RecordDrawerDeal => ({
  id,
  name,
  company: { name: company, email: `hello@${id}.example` },
  owner: ana,
  industry: 'Hospitality',
  stage,
  probability,
  value,
  createdAt: '2026-09-01T09:00:00.000Z',
  closesAt: '2026-12-15T09:00:00.000Z',
  nextStepAt: '2026-10-12T09:00:00.000Z',
  lastEditedBy: jun,
  meetings: [{ id: `${id}-m`, title: 'Site visit', at: '2026-10-04T14:00:00.000Z', href: `#/meetings/${id}` }],
  progress: [{ id: `${id}-p`, text: 'Floor plan received', author: jun, at: '2026-10-05T08:00:00.000Z' }],
  notes: [],
  activity: [{ id: `${id}-a`, text: 'Jun added a contact', author: jun, at: '2026-10-02T11:20:00.000Z' }],
})

/** A venue-booking CRM: its own deals, people, words, currency and handlers. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    brand: { name: 'Banquet' },
    defaultValue: 'harbor',
    deals: [
      listing('harbor', 'Harbor Hall', 'Winter gala', 'proposal', 55, 18_400),
      listing('linden', 'Linden Terrace', 'Product launch dinner', 'qualified', 30, 9_200),
      listing('quarry', 'The Quarry Rooms', 'Annual conference', 'negotiation', 80, 46_000),
    ],
    copy: { title: 'Bookings', description: 'Events in the works and who is running them.', section: 'Venues', newDeal: 'New booking' },
    locale: 'en-GB',
    currency: 'GBP',
    getHref: (deal) => `#/bookings/${deal.id}`,
    onValueChange: fn(),
    onEdit: fn(),
    onOpen: fn(),
    onEditProperty: fn(),
    onViewAll: fn(),
    onCreate: fn(),
  },
}
