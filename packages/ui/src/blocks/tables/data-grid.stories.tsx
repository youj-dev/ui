import type { Meta, StoryObj } from '@storybook/react-vite'
import { PlusIcon, UsersIcon } from '@youj/icons'
import { Button } from '../../components/ui/button'
import { DataGrid } from './data-grid'
import { NOW, customerActions, customerColumns, customerViews, makeCustomers, viewCounts, type Customer } from './data-grid.fixtures'

const meta: Meta<typeof DataGrid> = {
  title: 'Blocks/Tables/Data Grid',
  component: DataGrid,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'The complete records grid, for records with a face and a pulse: a rich cell for every kind of value (an identity with its logo, a status, tags, a meter, a trend line, money in tabular mono, relative dates, people as avatars, a switch, a copyable id, a link), views as tabs, filters as chips, grouping with totals, detail panels under rows and cards on a narrow screen. Row actions fade in where the pointer is, the selection bar rises with a rolling count, and the grid is one Tab stop driven by the arrow keys.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof DataGrid>

/** The block as it installs: a product team's projects with status, team, progress, velocity, budget, target and tags, views as tabs, a detail panel per project, and bulk actions. */
export const Default: Story = {}

const customers = makeCustomers(64)
const counts = viewCounts(customers)
const HIDDEN = { lastSeen: false, id: false, domain: false, region: false, renewal: false, plan: false, autoRenew: false }

/** Your rows and columns: 64 customer accounts on the grid's column types, with saved views and their counts, row actions and `copy.noun`. */
export const WithYourData: Story = {
  args: {
    rows: customers as never,
    columns: customerColumns() as never,
    title: 'Customers',
    description: 'Every account with its health, revenue, seats and usage.',
    views: customerViews.map((view) => ({ ...view, count: counts[view.id] })),
    rowActions: customerActions() as never,
    selectable: true,
    now: NOW,
    pageSize: 10,
    initialState: { columnVisibility: HIDDEN },
    copy: { noun: 'customers' },
  },
}

/** Grouped by health: sticky headings that fold, and a footer with each group's total MRR. */
export const Grouping: Story = {
  args: {
    rows: customers.slice(0, 28) as never,
    columns: customerColumns() as never,
    title: 'Customers by health',
    selectable: true,
    now: NOW,
    height: 620,
    initialState: { grouping: 'health', collapsedGroups: { trial: true }, columnVisibility: { ...HIDDEN, tags: false } },
    copy: { noun: 'customers' },
  },
}

/** On a narrow screen each row is a card: the identity as its title, the status beside it, the rest as fields. */
export const Cards: Story = {
  args: {
    rows: customers as never,
    columns: customerColumns() as never,
    title: 'Customers',
    layout: 'cards',
    selectable: true,
    rowActions: customerActions() as never,
    now: NOW,
    pageSize: 6,
    initialState: { columnVisibility: { ...HIDDEN, renewsAt: false } },
    copy: { noun: 'customers' },
    className: 'max-w-sm',
  },
}

const thousand = makeCustomers(1200)

/** 1,200 accounts, virtualized: only the rows in view are in the page, and it scrolls, sorts and selects at full speed. */
export const Virtualized: Story = {
  args: { rows: thousand as never, columns: customerColumns() as never, title: 'Customers', virtualize: true, height: 620, selectable: true, now: NOW, initialState: { columnVisibility: HIDDEN }, copy: { noun: 'customers' } },
}

/** The first load: skeleton rows shaped like each column. */
export const Loading: Story = { args: { rows: [] as Customer[] as never, columns: customerColumns() as never, title: 'Customers', loading: true, copy: { noun: 'customers' } } }

/** Nothing yet: the empty state takes an illustration and the next step. */
export const Empty: Story = {
  args: {
    rows: [] as Customer[] as never,
    columns: customerColumns() as never,
    title: 'Customers',
    copy: { noun: 'customers' },
    empty: {
      title: 'No customers yet',
      description: 'Customers appear here once they start a trial or you import them.',
      illustration: (
        <span className="grid size-12 place-items-center rounded-2xl border border-line bg-band text-fg-muted">
          <UsersIcon />
        </span>
      ),
      action: (
        <Button size="sm">
          <PlusIcon />
          Import customers
        </Button>
      ),
    },
  },
}

/** A failed load: the error panel replaces the rows, with Try again. */
export const LoadError: Story = {
  args: { rows: [] as Customer[] as never, columns: customerColumns() as never, title: 'Customers', error: 'The billing service didn’t answer in time.', onRetry: () => {}, copy: { noun: 'customers' } },
}

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. By default it's the grid alone, for your page to place. */
export const Standalone: Story = { args: { embedded: false } }
