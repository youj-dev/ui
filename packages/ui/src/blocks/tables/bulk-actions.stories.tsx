import type { Meta, StoryObj } from '@storybook/react-vite'
import { BanIcon, BanknoteIcon, BellIcon, BuildingIcon, CalendarPlusIcon, CarIcon, CheckCircleIcon, CircleDashedIcon, ClockIcon, CreditCardIcon, DownloadIcon, LibraryIcon, SendIcon, XIcon } from '@youj/icons'
import { BulkActionsTable } from './bulk-actions'
import type { BulkActionsTableAction, BulkActionsTableChannel, BulkActionsTableRow, BulkActionsTableStatus } from './bulk-actions/data'

const meta: Meta<typeof BulkActionsTable> = {
  title: 'Blocks/Tables/Bulk Actions',
  component: BulkActionsTable,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Work through rows in bulk: filter by either status, channel, date or amount, select a few, and a command bar runs the actions you define (the demo fulfills, prints, marks paid, refunds after a confirmation that names the count, archives or exports), each with its own key and every action in a menu you can search.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof BulkActionsTable>

/** The block as it installs: 64 demo orders across four channels. */
export const Default: Story = { name: 'Store orders' }

const ORDERS: BulkActionsTableRow[] = [
  { id: 'o1', ref: 'SO-3001', party: { name: 'Grace Hopper', email: 'grace@cobol.dev' }, status: 'paid', stage: 'unfulfilled', channel: 'web', count: 2, amount: 129, at: '2026-09-29T09:12:00Z' },
  { id: 'o2', ref: 'SO-3000', party: { name: 'Alan Turing', email: 'alan@enigma.uk' }, status: 'pending', stage: 'unfulfilled', channel: 'ios', count: 1, amount: 49.5, at: '2026-09-28T17:40:00Z' },
  { id: 'o3', ref: 'SO-2999', party: { name: 'Ada Lovelace', email: 'ada@engine.io' }, status: 'paid', stage: 'fulfilled', channel: 'store', count: 4, amount: 312.2, at: '2026-09-27T11:05:00Z' },
]

/** Your orders in euros, with the strings rewritten. */
export const WithYourData: Story = {
  args: { rows: ORDERS, currency: 'EUR', copy: { title: 'Sales orders', create: 'New sales order' } },
}

/** The first load: skeleton rows in each column's shape. */
export const Loading: Story = { args: { rows: [], loading: true } }

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. */
export const Standalone: Story = { args: { embedded: false } }

const row = (id: string, ref: string, name: string, status: string, stage: string, channel: string, count: number, amount: number, at: string): BulkActionsTableRow => ({
  id,
  ref,
  party: { name, email: `${name.split(' ')[0]!.toLowerCase()}@${name.split(' ')[1]!.toLowerCase()}.mail` },
  status,
  stage,
  channel,
  count,
  amount,
  at,
})

const REPORT_STATUSES: BulkActionsTableStatus[] = [
  { id: 'submitted', label: 'Pending', tone: 'warning', icon: ClockIcon },
  { id: 'approved', label: 'Approved', tone: 'success', icon: CheckCircleIcon, counted: true },
  { id: 'rejected', label: 'Rejected', tone: 'danger', icon: XIcon },
]
const REPORT_STAGES: BulkActionsTableStatus[] = [
  { id: 'unpaid', label: 'Not paid', icon: CircleDashedIcon, dashed: true },
  { id: 'scheduled', label: 'Scheduled', tone: 'warning', icon: CalendarPlusIcon },
  { id: 'reimbursed', label: 'Paid out', tone: 'neutral', icon: BanknoteIcon },
]
const REPORT_CHANNELS: BulkActionsTableChannel[] = [
  { id: 'card', label: 'Company card', icon: CreditCardIcon },
  { id: 'cash', label: 'Cash', icon: BanknoteIcon },
  { id: 'transfer', label: 'Bank transfer', icon: BuildingIcon },
]
const REPORT_ACTIONS: BulkActionsTableAction[] = [
  {
    id: 'approve',
    label: 'Approve',
    icon: CheckCircleIcon,
    shortcut: 'A',
    primary: true,
    done: 'Approved',
    inRow: true,
    disabled: (r) => r.status === 'approved',
    apply: (r) => ({ ...r, status: 'approved', stage: r.stage === 'unpaid' ? 'scheduled' : r.stage }),
  },
  {
    id: 'reject',
    label: 'Reject',
    icon: XIcon,
    shortcut: 'R',
    destructive: true,
    confirm: 'The employees are told their reports were rejected and can resubmit them.',
    done: 'Rejected',
    apply: (r) => ({ ...r, status: 'rejected' }),
  },
  { id: 'export', label: 'Export CSV', icon: DownloadIcon, shortcut: 'E', primary: true, csv: true, done: 'Exported' },
]
const REPORTS: BulkActionsTableRow[] = [
  row('r1', 'ER-2041', 'Priya Raman', 'submitted', 'unpaid', 'card', 6, 842.15, '2026-09-29T08:30:00Z'),
  row('r2', 'ER-2040', 'Tomas Weber', 'approved', 'scheduled', 'transfer', 3, 215, '2026-09-28T16:05:00Z'),
  row('r3', 'ER-2039', 'Imani Brooks', 'submitted', 'unpaid', 'cash', 9, 96.4, '2026-09-28T10:12:00Z'),
  row('r4', 'ER-2038', 'Nils Aaberg', 'approved', 'reimbursed', 'card', 12, 1480.9, '2026-09-26T14:48:00Z'),
  row('r5', 'ER-2037', 'Camila Duarte', 'rejected', 'unpaid', 'card', 2, 310, '2026-09-25T09:20:00Z'),
  row('r6', 'ER-2036', 'Owen Park', 'approved', 'reimbursed', 'transfer', 5, 623.75, '2026-09-24T13:00:00Z'),
  row('r7', 'ER-2035', 'Selma Haddad', 'submitted', 'unpaid', 'card', 4, 188.2, '2026-09-23T17:35:00Z'),
  row('r8', 'ER-2034', 'Jonas Lind', 'approved', 'scheduled', 'cash', 7, 74.5, '2026-09-22T11:11:00Z'),
  row('r9', 'ER-2033', 'Mei Tanaka', 'submitted', 'unpaid', 'transfer', 1, 2250, '2026-09-21T15:42:00Z'),
  row('r10', 'ER-2032', 'Diego Ortiz', 'approved', 'reimbursed', 'card', 8, 536.3, '2026-09-20T09:03:00Z'),
]

/** Finance: two approval-and-payout columns, approve, reject (after a confirmation) and export as the only actions. */
export const ExpenseReports: Story = {
  name: 'Expense reports',
  args: {
    rows: REPORTS,
    statuses: REPORT_STATUSES,
    stages: REPORT_STAGES,
    channels: REPORT_CHANNELS,
    actions: REPORT_ACTIONS,
    copy: {
      title: 'Expense reports',
      description: (n, total) => `${n} reports · ${total} approved this month`,
      noun: 'reports',
      search: 'Search reports, employees…',
      create: 'New report',
      columns: { ref: 'Report', at: 'Submitted', party: 'Employee', channel: 'Paid with', status: 'Approval', stage: 'Payout', count: 'Receipts', amount: 'Total' },
      open: 'Open report',
      countOf: (n, count) => `${n} ${count === 1 ? 'report' : 'reports'}`,
    },
  },
}

const HOLD_STATUSES: BulkActionsTableStatus[] = [
  { id: 'waiting', label: 'Waiting', tone: 'neutral', icon: ClockIcon, counted: true },
  { id: 'ready', label: 'Ready', tone: 'success', icon: CheckCircleIcon, counted: true },
  { id: 'expired', label: 'Expired', tone: 'danger', icon: XIcon, counted: true },
  { id: 'cancelled', label: 'Void', tone: 'neutral', icon: BanIcon },
]
const HOLD_STAGES: BulkActionsTableStatus[] = [
  { id: 'shelf', label: 'On shelf', icon: CircleDashedIcon, dashed: true },
  { id: 'reminded', label: 'Reminded', tone: 'warning', icon: BellIcon },
  { id: 'collected', label: 'Collected', tone: 'neutral', icon: CheckCircleIcon },
]
const HOLD_BRANCHES: BulkActionsTableChannel[] = [
  { id: 'central', label: 'Central Library', icon: LibraryIcon },
  { id: 'eastside', label: 'Eastside branch', icon: BuildingIcon },
  { id: 'mobile', label: 'Mobile library', icon: CarIcon },
]
const HOLD_ACTIONS: BulkActionsTableAction[] = [
  { id: 'notify', label: 'Notify', icon: SendIcon, shortcut: 'N', primary: true, done: 'Notified', inRow: true, apply: (r) => (r.stage === 'shelf' ? { ...r, stage: 'reminded' } : r) },
  { id: 'extend', label: 'Extend 7 days', icon: CalendarPlusIcon, shortcut: 'X', primary: true, done: 'Extended', inRow: true, disabled: (r) => r.stage === 'collected' },
  {
    id: 'cancel',
    label: 'Cancel hold',
    icon: BanIcon,
    shortcut: 'C',
    destructive: true,
    confirm: 'The patrons are told their holds were cancelled and the books go back on the shelf.',
    done: 'Cancelled',
    apply: (r) => ({ ...r, status: 'cancelled' }),
  },
]
const HOLDS: BulkActionsTableRow[] = [
  row('h1', 'H-8812', 'Margit Olsen', 'ready', 'shelf', 'central', 2, 0, '2026-09-29T10:20:00Z'),
  row('h2', 'H-8811', 'Kofi Mensah', 'waiting', 'shelf', 'eastside', 1, 0, '2026-09-29T08:02:00Z'),
  row('h3', 'H-8810', 'Lucia Bianchi', 'expired', 'reminded', 'central', 3, 4.5, '2026-09-27T15:44:00Z'),
  row('h4', 'H-8809', 'Arjun Mehta', 'ready', 'reminded', 'mobile', 1, 0, '2026-09-26T12:30:00Z'),
  row('h5', 'H-8808', 'Hannah Fisher', 'ready', 'collected', 'eastside', 2, 0, '2026-09-25T09:15:00Z'),
  row('h6', 'H-8807', 'Rui Carvalho', 'waiting', 'shelf', 'central', 4, 0, '2026-09-24T17:50:00Z'),
  row('h7', 'H-8806', 'Esi Boateng', 'expired', 'shelf', 'mobile', 1, 2, '2026-09-22T11:00:00Z'),
  row('h8', 'H-8805', 'Pavel Novak', 'cancelled', 'shelf', 'eastside', 1, 0, '2026-09-21T14:25:00Z'),
  row('h9', 'H-8804', 'Sunita Rao', 'ready', 'shelf', 'central', 2, 0, '2026-09-20T10:10:00Z'),
  row('h10', 'H-8803', 'Magnus Berg', 'expired', 'reminded', 'eastside', 2, 6.25, '2026-09-18T16:40:00Z'),
]

/** Education: a hold and a pickup status, late fees for the amount, and notify, extend and cancel (after a confirmation). */
export const LibraryHolds: Story = {
  name: 'Library holds',
  args: {
    rows: HOLDS,
    statuses: HOLD_STATUSES,
    stages: HOLD_STAGES,
    channels: HOLD_BRANCHES,
    actions: HOLD_ACTIONS,
    copy: {
      title: 'Holds',
      description: (n, total) => `${n} holds · ${total} in late fees`,
      noun: 'holds',
      search: 'Search holds, patrons…',
      create: 'Place a hold',
      columns: { ref: 'Hold', at: 'Placed', party: 'Patron', channel: 'Branch', status: 'Hold', stage: 'Pickup', count: 'Items', amount: 'Late fee' },
      open: 'Open hold',
      countOf: (n, count) => `${n} ${count === 1 ? 'hold' : 'holds'}`,
    },
  },
}
