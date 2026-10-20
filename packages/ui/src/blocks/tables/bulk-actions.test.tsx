import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { BulkActionsTable, type BulkActionsTableProps } from './bulk-actions'
import { DEFAULT_COPY, type BulkActionsTableAction, type BulkActionsTableRow } from './bulk-actions/data'

const ROWS: BulkActionsTableRow[] = [
  { id: 'o1', ref: 'SO-3001', party: { name: 'Grace Hopper', email: 'grace@cobol.dev' }, status: 'paid', stage: 'unfulfilled', channel: 'web', count: 2, amount: 129, at: '2026-09-29T09:12:00Z' },
  { id: 'o2', ref: 'SO-3000', party: { name: 'Alan Turing', email: 'alan@enigma.uk' }, status: 'pending', stage: 'unfulfilled', channel: 'ios', count: 1, amount: 49.5, at: '2026-09-28T17:40:00Z' },
  { id: 'o3', ref: 'SO-2999', party: { name: 'Ada Lovelace', email: 'ada@engine.io' }, status: 'paid', stage: 'fulfilled', channel: 'store', count: 4, amount: 312.2, at: '2026-09-27T11:05:00Z' },
]

function renderTable(props: Partial<BulkActionsTableProps> = {}) {
  const user = userEvent.setup()
  render(
    <YoujProvider reducedMotion="always" locale="en-US">
      <BulkActionsTable rows={ROWS} {...props} />
    </YoujProvider>,
  )
  return user
}

const grid = () => screen.getByRole('grid')
const rowOf = (number: string) => within(grid()).getAllByRole('row').find((row) => row.textContent?.includes(number))!
const select = (user: ReturnType<typeof userEvent.setup>, number: string) => user.click(screen.getByRole('checkbox', { name: `Select ${number}` }))

describe('BulkActionsTable', () => {
  test('names its section and the grid by its title, and shows the orders it is given', () => {
    renderTable()
    expect(screen.getByRole('region', { name: 'Orders' })).toBeInTheDocument()
    expect(grid()).toHaveAccessibleName('Orders')
    for (const order of ROWS) expect(within(grid()).getByText(order.ref)).toBeInTheDocument()
    expect(within(rowOf('SO-3001')).getByText('$129.00')).toBeInTheDocument()
  })

  test('copy and currency rewrite what it says', () => {
    renderTable({ currency: 'EUR', copy: { title: 'Sales orders', create: 'New sales order' } })
    expect(screen.getByRole('heading', { name: 'Sales orders' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /New sales order/ })).toBeInTheDocument()
    expect(within(rowOf('SO-3001')).getByText('€129.00')).toBeInTheDocument()
  })

  test('the command bar fulfills the selection through onFulfill and clears it', async () => {
    const onFulfill = vi.fn()
    const user = renderTable({ onFulfill })
    await select(user, 'SO-3001')
    const bar = await screen.findByRole('group', { name: 'Selection actions' })
    await user.click(within(bar).getByRole('button', { name: /Fulfill/ }))
    expect(onFulfill).toHaveBeenCalledWith([expect.objectContaining({ id: 'o1' })])
    await waitFor(() => expect(within(rowOf('SO-3001')).getByText('Fulfilled')).toBeInTheDocument())
    await waitFor(() => expect(screen.queryByRole('group', { name: 'Selection actions' })).not.toBeInTheDocument())
  })

  test('a letter runs its action while rows are selected', async () => {
    const onPrint = vi.fn()
    const user = renderTable({ onPrint })
    await select(user, 'SO-3000')
    await user.keyboard('p')
    expect(onPrint).toHaveBeenCalledWith([expect.objectContaining({ id: 'o2' })])
  })

  test('the menu finds an action by name and runs it', async () => {
    const onMarkPaid = vi.fn()
    const user = renderTable({ onMarkPaid })
    await select(user, 'SO-3000')
    const bar = await screen.findByRole('group', { name: 'Selection actions' })
    await user.click(within(bar).getByRole('button', { name: 'More actions' }))
    await user.type(await screen.findByPlaceholderText('Run an action on the selection…'), 'paid')
    await user.click(await screen.findByRole('option', { name: /Mark as paid/ }))
    expect(onMarkPaid).toHaveBeenCalledWith([expect.objectContaining({ id: 'o2' })])
    await waitFor(() => expect(within(rowOf('SO-3000')).getByText('Paid')).toBeInTheDocument())
  })

  test('a refused archive brings the rows back and says why', async () => {
    const onArchive = vi.fn().mockRejectedValue(new Error('Orders with open disputes stay.'))
    const user = renderTable({ onArchive })
    await select(user, 'SO-2999')
    await user.keyboard('a')
    expect(await screen.findByText('Orders with open disputes stay.')).toBeInTheDocument()
    expect(within(grid()).getByText('SO-2999')).toBeInTheDocument()
  })

  test('refund asks first and names the count', async () => {
    const onRefund = vi.fn()
    const user = renderTable({ onRefund })
    await select(user, 'SO-3001')
    await user.keyboard('r')
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent(/Refund 1 order/)
    await user.click(within(dialog).getByRole('button', { name: /Refund 1 order/ }))
    await waitFor(() => expect(onRefund).toHaveBeenCalledWith([expect.objectContaining({ id: 'o1' })]))
  })

  test('an order number opens it', async () => {
    const onRowOpen = vi.fn()
    const user = renderTable({ onRowOpen })
    await user.click(within(grid()).getByRole('button', { name: 'SO-2999' }))
    expect(onRowOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'o3' }))
  })

  test('statuses, stages and channels you pass label the columns', () => {
    renderTable({
      rows: [{ id: 'x1', ref: 'H-1', party: { name: 'Margit Olsen', email: 'm@o.mail' }, status: 'ready', stage: 'reminded', channel: 'mobile', count: 1, amount: 0, at: '2026-09-29T09:00:00Z' }],
      statuses: [{ id: 'ready', label: 'Ready to collect', tone: 'success' }],
      stages: [{ id: 'reminded', label: 'Reminded by SMS', tone: 'warning' }],
      channels: [{ id: 'mobile', label: 'Mobile library' }],
      copy: { columns: { ...DEFAULT_COPY.columns, status: 'Hold', stage: 'Pickup' } },
    })
    const row = rowOf('H-1')
    expect(within(row).getByText('Ready to collect')).toBeInTheDocument()
    expect(within(row).getByText('Reminded by SMS')).toBeInTheDocument()
    expect(within(row).getByText('Mobile library')).toBeInTheDocument()
    expect(within(grid()).getByRole('columnheader', { name: /Hold/ })).toBeInTheDocument()
  })

  test('your actions fill the bar and run through onAction, with the confirmation of one that asks', async () => {
    const onAction = vi.fn()
    const actions: BulkActionsTableAction[] = [
      { id: 'approve', label: 'Approve', shortcut: 'A', primary: true, done: 'Approved' },
      { id: 'reject', label: 'Reject', shortcut: 'J', destructive: true, confirm: 'They are told.' },
    ]
    const user = renderTable({ actions, onAction })
    await select(user, 'SO-3001')
    const bar = await screen.findByRole('group', { name: 'Selection actions' })
    expect(within(bar).queryByRole('button', { name: /Fulfill/ })).not.toBeInTheDocument()
    await user.click(within(bar).getByRole('button', { name: /Approve/ }))
    expect(onAction).toHaveBeenCalledWith('approve', [expect.objectContaining({ id: 'o1' })])
    await user.keyboard('j')
    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('They are told.')
    await user.click(within(dialog).getByRole('button', { name: /Reject 1 order/ }))
    await waitFor(() => expect(onAction).toHaveBeenCalledWith('reject', [expect.objectContaining({ id: 'o1' })]))
  })

  test('an action with apply changes the rows at once', async () => {
    const actions: BulkActionsTableAction[] = [{ id: 'hold', label: 'Hold', shortcut: 'H', primary: true, apply: (r) => ({ ...r, status: 'pending' }) }]
    const user = renderTable({ actions, onAction: vi.fn() })
    await select(user, 'SO-3001')
    await user.keyboard('h')
    await waitFor(() => expect(within(rowOf('SO-3001')).getByText('Pending')).toBeInTheDocument())
  })

  test('shows its error with Retry', async () => {
    const onRetry = vi.fn()
    const user = renderTable({ error: 'Could not load orders', onRetry })
    expect(await screen.findByText('Could not load orders')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /retry|try again/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  test('no rows show the empty state you pass', () => {
    renderTable({ rows: [], empty: <p>Nothing to fulfill</p> })
    expect(screen.getByText('Nothing to fulfill')).toBeInTheDocument()
  })
})
