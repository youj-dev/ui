import type { Meta, StoryObj } from '@storybook/react-vite'
import { GroupedTable } from './grouped'
import type { GroupedTableGrouping, GroupedTableLine } from './grouped/data'

const meta: Meta<typeof GroupedTable> = {
  title: 'Blocks/Tables/Grouped',
  component: GroupedTable,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Planned against spent as a tree: lines grouped the ways you define (the demo: a budget by team, category or owner), each group summing its plan, spend, variance and share used down to a grand total. Groups open and close from the keyboard (a treegrid), and sorting a money column sorts every level inside itself.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof GroupedTable>

/** The block as it installs: a quarter's 28 lines, departments open on their teams. */
export const Default: Story = { name: 'Operating budget' }

const LINES: GroupedTableLine[] = [
  { id: 'r1', name: 'Venue deposit', group: 'Production', subgroup: 'Venue', category: 'Venue', owner: 'Ama Boateng', budget: 24_000, actual: 24_000 },
  { id: 'r2', name: 'Stage and AV', group: 'Production', subgroup: 'Venue', category: 'Equipment', owner: 'Ama Boateng', budget: 18_000, actual: 21_500 },
  { id: 'r3', name: 'Catering', group: 'Production', subgroup: 'Hospitality', category: 'Food', owner: 'Jonas Weber', budget: 32_000, actual: 27_900 },
  { id: 'r4', name: 'Speaker travel', group: 'Programme', subgroup: 'Speakers', category: 'Travel', owner: 'Priya Natarajan', budget: 15_000, actual: 16_200 },
  { id: 'r5', name: 'Livestream', group: 'Programme', subgroup: 'Broadcast', category: 'Equipment', owner: 'Jonas Weber', budget: 9_000, actual: 6_300 },
]

/** A conference's budget in euros, grouped by category. */
export const WithYourData: Story = {
  args: { lines: LINES, currency: 'EUR', defaultGroupBy: 'category', copy: { title: 'Conference budget', period: 'Berlin 2027' } },
}

/** The first load: skeleton rows. */
export const Loading: Story = { args: { lines: [], loading: true } }

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. */
export const Standalone: Story = { args: { embedded: false } }

const HOURS: GroupedTableLine[] = [
  { id: 'h1', name: 'User interviews', group: 'Discovery', subgroup: 'Design', category: 'Research', owner: 'Priya Natarajan', budget: 40, actual: 46 },
  { id: 'h2', name: 'Opportunity mapping', group: 'Discovery', subgroup: 'Product', category: 'Planning', owner: 'Ama Boateng', budget: 16, actual: 14 },
  { id: 'h3', name: 'Technical spike', group: 'Discovery', subgroup: 'Engineering', category: 'Research', owner: 'Jonas Weber', budget: 24, actual: 31 },
  { id: 'h4', name: 'Design system tokens', group: 'Build', subgroup: 'Design', category: 'Delivery', owner: 'Priya Natarajan', budget: 60, actual: 52 },
  { id: 'h5', name: 'Checkout flow', group: 'Build', subgroup: 'Engineering', category: 'Delivery', owner: 'Jonas Weber', budget: 120, actual: 138 },
  { id: 'h6', name: 'Payments integration', group: 'Build', subgroup: 'Engineering', category: 'Delivery', owner: 'Noor Haddad', budget: 80, actual: 74 },
  { id: 'h7', name: 'Accessibility review', group: 'Build', subgroup: 'Design', category: 'Review', owner: 'Ama Boateng', budget: 20, actual: 12 },
  { id: 'h8', name: 'Load testing', group: 'Launch', subgroup: 'Engineering', category: 'Review', owner: 'Noor Haddad', budget: 32, actual: 8 },
  { id: 'h9', name: 'Launch plan', group: 'Launch', subgroup: 'Product', category: 'Planning', owner: 'Ama Boateng', budget: 18, actual: 9 },
  { id: 'h10', name: 'Support playbook', group: 'Launch', subgroup: 'Product', category: 'Delivery', owner: 'Priya Natarajan', budget: 14, actual: 3 },
]
const HOURS_GROUPINGS: GroupedTableGrouping[] = [
  { id: 'phase', label: 'Phase', by: ['group', 'subgroup'], open: 'all' },
  { id: 'team', label: 'Team', by: ['subgroup'] },
  { id: 'person', label: 'Person', by: ['owner'] },
  { id: 'flat', label: 'None', by: [] },
]

/** Planned against logged hours by phase, team or person, in hours rather than money. */
export const ProjectHours: Story = {
  name: 'Project hours',
  args: {
    lines: HOURS,
    groupings: HOURS_GROUPINGS,
    format: (n) => `${n} h`,
    copy: {
      title: 'Project hours',
      period: 'Sprint 14',
      description: (period, planned, logged) => `${period} · ${logged} of ${planned} logged`,
      columns: { name: 'Task', owner: 'Owner', category: 'Type', budget: 'Planned', actual: 'Logged', variance: 'Variance', used: 'Used' },
      over: 'over plan',
      under: 'under plan',
      emptyTitle: 'No tasks yet',
      emptyHint: 'Tasks show up here once the sprint is planned.',
    },
  },
}

const EVENT: GroupedTableLine[] = [
  { id: 'e1', name: 'Garden terrace hire', group: 'Ceremony', subgroup: 'Linden Estate', category: 'Venue', owner: 'Rosa Alvarez', budget: 6_500, actual: 6_500 },
  { id: 'e2', name: 'Chairs and arch', group: 'Ceremony', subgroup: 'Linden Estate', category: 'Furniture', owner: 'Rosa Alvarez', budget: 1_200, actual: 1_450 },
  { id: 'e3', name: 'Ceremony florals', group: 'Ceremony', subgroup: 'Petal & Stem', category: 'Flowers', owner: 'Mei Lin', budget: 1_800, actual: 1_650 },
  { id: 'e4', name: 'String quartet', group: 'Ceremony', subgroup: 'Alder Strings', category: 'Music', owner: 'Mei Lin', budget: 1_400, actual: 1_400 },
  { id: 'e5', name: 'Dinner for 80', group: 'Reception', subgroup: 'Saffron Table', category: 'Food', owner: 'Rosa Alvarez', budget: 9_600, actual: 10_240 },
  { id: 'e6', name: 'Cake and desserts', group: 'Reception', subgroup: 'Saffron Table', category: 'Food', owner: 'Mei Lin', budget: 900, actual: 780 },
  { id: 'e7', name: 'Band and DJ', group: 'Reception', subgroup: 'Northern Lights', category: 'Music', owner: 'Tomas Reyes', budget: 3_200, actual: 3_200 },
  { id: 'e8', name: 'Table florals', group: 'Reception', subgroup: 'Petal & Stem', category: 'Flowers', owner: 'Mei Lin', budget: 1_500, actual: 1_720 },
  { id: 'e9', name: 'Photographer', group: 'Day of', subgroup: 'Lumen Studio', category: 'Photo', owner: 'Tomas Reyes', budget: 3_800, actual: 3_800 },
  { id: 'e10', name: 'Shuttle buses', group: 'Day of', subgroup: 'Coastline Coaches', category: 'Transport', owner: 'Tomas Reyes', budget: 1_100, actual: 640 },
]
const EVENT_GROUPINGS: GroupedTableGrouping[] = [
  { id: 'part', label: 'Part', by: ['group', 'subgroup'], open: 'all' },
  { id: 'category', label: 'Vendor type', by: ['category'] },
  { id: 'owner', label: 'Handled by', by: ['owner'] },
]

/** A wedding: plan against spend by part of the day and vendor, or by type of vendor. */
export const EventBudget: Story = {
  name: 'Event budget',
  args: {
    lines: EVENT,
    groupings: EVENT_GROUPINGS,
    currency: 'EUR',
    copy: {
      title: 'Wedding budget',
      period: 'Lisbon, June',
      columns: { name: 'Item', owner: 'Handled by', category: 'Vendor type', budget: 'Plan', actual: 'Spent', variance: 'Variance', used: 'Used' },
      groupBy: 'Group by',
      emptyTitle: 'Nothing planned yet',
      emptyHint: 'Items show up here as you book vendors.',
    },
  },
}
