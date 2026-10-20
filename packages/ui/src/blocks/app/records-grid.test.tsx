import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { RecordsGrid, type OrderRow } from './records-grid'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const grid = () => screen.getByRole('grid', { name: 'Orders' })
const rows = () => [...grid().querySelectorAll<HTMLElement>('tbody tr[data-dg-kind=row]')]
const orderOf = (row: HTMLElement) => row.querySelector<HTMLElement>('[data-order]')!.textContent!

// jsdom lays nothing out: give elements a desk-sized box so the virtualizer has rows in view.
const box = { offsetHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')!, offsetWidth: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')! }
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 640 })
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => 1280 })
})
afterAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', box.offsetHeight)
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', box.offsetWidth)
})

describe('Orders (data grid) block', () => {
  test('heads a virtualized grid of orders with its views as tabs', () => {
    reduced(<RecordsGrid embedded={false} count={40} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Orders' })).toBeInTheDocument()
    expect(rows().length).toBeGreaterThan(0)
    // Virtualized: no pager.
    expect(screen.queryByRole('navigation', { name: /pagination/i })).toBeNull()
    const tabs = within(screen.getByRole('tablist', { name: 'Views' })).getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent?.replace(/[\d,]+$/, ''))).toEqual(['All', 'To ship', 'Payment issues', 'Returns'])
  })

  test('a click on a row opens its order in a sheet; Escape closes it', async () => {
    const user = userEvent.setup()
    reduced(<RecordsGrid count={40} />)
    const row = rows()[1]!
    const id = orderOf(row)
    await user.click(within(row).getAllByRole('gridcell')[3]!)
    const sheet = await screen.findByRole('dialog', { name: id })
    expect(within(sheet).getByText('Total')).toBeInTheDocument()
    expect(within(sheet).getByRole('list', { name: 'Progress' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: id })).toBeNull())
  })

  test('Enter on a row opens it from the keyboard', async () => {
    const user = userEvent.setup()
    reduced(<RecordsGrid count={40} />)
    const first = orderOf(rows()[0]!)
    act(() => grid().querySelector<HTMLElement>('[tabindex="0"]')!.focus())
    await user.keyboard('{ArrowDown}{ArrowRight}{Enter}')
    expect(await screen.findByRole('dialog', { name: first })).toBeInTheDocument()
  })

  test('the next step in the sheet moves the order on, with Undo', async () => {
    const user = userEvent.setup()
    reduced(<RecordsGrid count={40} />)
    const row = rows().find((r) => /Paid/.test(r.textContent!) && /Unfulfilled/.test(r.textContent!))!
    const id = orderOf(row)
    await user.click(row.querySelector('[data-order]')!)
    const sheet = await screen.findByRole('dialog', { name: id })
    await user.click(within(sheet).getByRole('button', { name: /Mark as packed/ }))
    expect(await screen.findByText(`${id} marked packed`)).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: /Mark as shipped/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(within(sheet).getByRole('button', { name: /Mark as packed/ })).toBeInTheDocument())
  })

  test('marking a selection shipped updates its rows and clears the selection', async () => {
    const user = userEvent.setup()
    reduced(<RecordsGrid count={40} />)
    const ready = rows().filter((r) => /Paid/.test(r.textContent!) && /Unfulfilled|Packed/.test(r.textContent!)).slice(0, 2)
    for (const row of ready) await user.click(within(row).getByRole('checkbox'))
    const ids = ready.map(orderOf)
    await user.click(within(screen.getByRole('group', { name: 'Selection actions' })).getByRole('button', { name: /Shipped/ }))
    expect(await screen.findByText('2 orders marked shipped')).toBeInTheDocument()
    for (const id of ids) {
      const row = rows().find((r) => orderOf(r) === id)!
      expect(row).toHaveTextContent('Shipped')
      expect(row).not.toHaveAttribute('aria-selected', 'true')
    }
  })

  test('on a phone the orders are paged cards', () => {
    const original = window.matchMedia
    window.matchMedia = ((query: string) => ({ ...original(query), matches: query.includes('max-width: 767px') })) as typeof window.matchMedia
    try {
      reduced(<RecordsGrid count={40} />)
      expect(document.querySelectorAll('[data-slot=data-grid-card]')).toHaveLength(12)
    } finally {
      window.matchMedia = original
    }
  })

  test('with no orders, the empty state explains where they come from', () => {
    reduced(<RecordsGrid count={0} />)
    expect(screen.getByText('No orders yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Share your shop' })).toBeInTheDocument()
  })

  describe('with your data', () => {
    const order = (id: string, customer: string, fulfilment: OrderRow['fulfilment'], total: number): OrderRow => ({
      id,
      customer,
      email: `${customer.split(' ')[0]!.toLowerCase()}@example.com`,
      channel: 'Web',
      payment: 'paid',
      fulfilment,
      items: [{ sku: 'BK-01', name: 'Field notebook', quantity: 2, price: total / 2 }],
      quantity: 2,
      shipping: 0,
      total,
      tags: [],
      country: 'Norway',
      city: 'Bergen',
      address: '4 Bryggen',
      carrier: 'Posten',
      placedAt: '2026-09-29T12:00:00.000Z',
    })
    const orders = [order('PB-1002', 'Ingrid Lie', 'unfulfilled', 48), order('PB-1001', 'Ola Nordmann', 'shipped', 96)]

    test('rows, brand and copy come from props', () => {
      reduced(<RecordsGrid embedded={false} orders={orders} brand={{ name: 'Paperboat' }} copy={{ section: 'Shop', station: 'Studio' }} />)
      expect(screen.getByText('Paperboat')).toBeInTheDocument()
      expect(screen.getByText('Studio')).toBeInTheDocument()
      expect(rows().map(orderOf)).toEqual(['PB-1002', 'PB-1001'])
    })

    test('headingLevel, className and rest props reach the root', () => {
      reduced(<RecordsGrid headingLevel={3} orders={orders} className="custom-root" data-testid="root" />)
      expect(screen.getByRole('heading', { level: 3, name: 'Orders' })).toBeInTheDocument()
      expect(screen.getByTestId('root')).toHaveClass('custom-root')
    })

    test('by default, a page of the app’s frame: the shared page header holds the title and actions, with no top bar of its own', () => {
      const { container } = reduced(<RecordsGrid orders={orders} brand={{ name: 'Paperboat' }} />)
      expect(screen.queryByRole('main')).not.toBeInTheDocument()
      const header = container.querySelector('[data-slot=app-page-header]')!
      expect(header).toContainElement(screen.getByRole('heading', { level: 1, name: 'Orders' }))
      expect(header).toContainElement(screen.getByRole('button', { name: /Draft order/ }))
      expect(screen.queryByText('Paperboat')).not.toBeInTheDocument()
    })

    test('the next step calls onFulfilmentChange; a rejection moves the order back and shows its message', async () => {
      const user = userEvent.setup()
      const onFulfilmentChange = vi.fn().mockRejectedValue(new Error('Warehouse offline'))
      const onOpen = vi.fn()
      reduced(<RecordsGrid orders={orders} onFulfilmentChange={onFulfilmentChange} onOpen={onOpen} />)
      await user.click(rows()[0]!.querySelector('[data-order]')!)
      expect(onOpen).toHaveBeenCalledWith(orders[0])
      const sheet = await screen.findByRole('dialog', { name: 'PB-1002' })
      await user.click(within(sheet).getByRole('button', { name: /Mark as packed/ }))
      expect(onFulfilmentChange).toHaveBeenCalledWith([orders[0]], 'packed')
      expect(await screen.findByText('Warehouse offline')).toBeInTheDocument()
      await waitFor(() => expect(within(sheet).getByRole('button', { name: /Mark as packed/ })).toBeInTheDocument())
    })

    test('the open order is controlled', async () => {
      const user = userEvent.setup()
      const onOpenOrderChange = vi.fn()
      reduced(<RecordsGrid orders={orders} openOrder="PB-1001" onOpenOrderChange={onOpenOrderChange} />)
      expect(await screen.findByRole('dialog', { name: 'PB-1001' })).toBeInTheDocument()
      await user.keyboard('{Escape}')
      expect(onOpenOrderChange).toHaveBeenCalledWith(null)
      expect(screen.getByRole('dialog', { name: 'PB-1001' })).toBeInTheDocument()
    })

    test('onRowClick replaces opening the sheet', async () => {
      const user = userEvent.setup()
      const onRowClick = vi.fn()
      reduced(<RecordsGrid orders={orders} onRowClick={onRowClick} />)
      await user.click(within(rows()[1]!).getAllByRole('gridcell')[3]!)
      expect(onRowClick).toHaveBeenCalledWith(orders[1])
      expect(screen.queryByRole('dialog')).toBeNull()
    })

    test('labels and export get the selected rows, with no demo toast', async () => {
      const user = userEvent.setup()
      const onPrintLabel = vi.fn()
      const onExport = vi.fn()
      const onSelectedChange = vi.fn()
      reduced(<RecordsGrid orders={orders} onPrintLabel={onPrintLabel} onExport={onExport} onSelectedChange={onSelectedChange} />)
      await user.click(within(rows()[0]!).getByRole('checkbox'))
      expect(onSelectedChange).toHaveBeenLastCalledWith(['PB-1002'], [orders[0]])
      const bar = screen.getByRole('group', { name: 'Selection actions' })
      await user.click(within(bar).getByRole('button', { name: /Labels/ }))
      await user.click(within(bar).getByRole('button', { name: /Export/ }))
      expect(onPrintLabel).toHaveBeenCalledWith([orders[0]])
      expect(onExport).toHaveBeenCalledWith([orders[0]])
      expect(screen.queryByText(/Printing/)).toBeNull()
    })

    test('the empty slot replaces the grid; the error panel offers Try again', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      const { unmount } = reduced(<RecordsGrid orders={[]} empty={<p>Open your shop</p>} />)
      expect(screen.getByText('Open your shop')).toBeInTheDocument()
      expect(screen.queryByRole('grid')).toBeNull()
      unmount()
      reduced(<RecordsGrid orders={orders} error="Couldn't reach the shop" onRetry={onRetry} />)
      expect(screen.getByText("Couldn't reach the shop")).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /Try again/ }))
      expect(onRetry).toHaveBeenCalled()
    })
  })
})
