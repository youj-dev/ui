import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { OrderDetail, type Order } from './order-detail'
import { ORDERS } from './order-detail/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const stepper = (name: RegExp) => screen.getByRole('list', { name })
const current = (list: HTMLElement) => within(list).getAllByRole('listitem').find((li) => li.getAttribute('aria-current') === 'step')

describe('Order detail block', () => {
  test('names the order, its status, items, payment and addresses', () => {
    reduced(<OrderDetail />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Order FW-48213' })).toBeInTheDocument()
    expect(screen.getByText('1 of 2 delivered')).toBeInTheDocument()
    const items = screen.getByRole('region', { name: 'Items' })
    expect(within(items).getAllByRole('listitem')).toHaveLength(3)
    expect(within(items).getByText('Package 1 · Delivered')).toBeInTheDocument()
    const payment = screen.getByRole('region', { name: 'Payment' })
    expect(within(payment).getByText('Total').nextSibling).toHaveTextContent('$349.01')
    expect(within(payment).getByText('−$35.70')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Addresses' })).toHaveTextContent('2419 Folsom Street, Apt 3')
  })

  test('a split order opens on the package still on its way, one tab per package', async () => {
    const user = userEvent.setup()
    reduced(<OrderDetail />)
    const tabs = screen.getByRole('tablist', { name: 'Packages' })
    expect(within(tabs).getAllByRole('tab')).toHaveLength(2)
    expect(within(tabs).getByRole('tab', { name: /Package 2/ })).toHaveAttribute('aria-selected', 'true')
    expect(current(stepper(/Package 2 delivery progress/))).toHaveTextContent('In transit')
    await user.click(within(tabs).getByRole('tab', { name: /Package 1/ }))
    const done = stepper(/Package 1 delivery progress/)
    expect(current(done)).toBeUndefined()
    expect(within(done).getAllByRole('listitem').every((li) => li.getAttribute('data-status') === 'complete')).toBe(true)
  })

  test('the tracker steps along the route to the package’s stage', () => {
    vi.useFakeTimers()
    try {
      render(
        <YoujProvider reducedMotion="never">
          <OrderDetail order="inTransit" />
        </YoujProvider>,
      )
      const list = stepper(/Package 1 delivery progress/)
      expect(current(list)).toHaveTextContent('Ordered')
      act(() => vi.advanceTimersByTime(600))
      expect(current(list)).toHaveTextContent('Packed')
      act(() => vi.advanceTimersByTime(2000))
      expect(current(list)).toHaveTextContent('In transit')
    } finally {
      vi.useRealTimers()
    }
  })

  test('track package adds the new scan, steps the tracker on and updates the window', async () => {
    const user = userEvent.setup()
    reduced(<OrderDetail />)
    expect(screen.getByText('By 8 pm')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Track package' }))
    expect(await screen.findByText('On the truck in San Francisco, CA', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(current(stepper(/Package 2 delivery progress/))).toHaveTextContent('Out for delivery')
    expect(screen.getByText('Between 2 and 6 pm')).toBeInTheDocument()
  })

  test('with nothing new, tracking says so', async () => {
    const user = userEvent.setup()
    reduced(<OrderDetail order="delivered" />)
    await user.click(screen.getByRole('button', { name: 'Track package' }))
    expect(await screen.findByText('No new scans from UPS', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  test('a return picks items, a reason and a refund, then marks the items', async () => {
    const user = userEvent.setup()
    reduced(<OrderDetail order="delivered" />)
    await user.click(screen.getByRole('button', { name: 'Return items' }))
    const dialog = await screen.findByRole('dialog', { name: 'Return items' })
    await user.click(within(dialog).getByRole('button', { name: 'Continue' }))
    expect(within(dialog).getByText('Choose at least one item to return.')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('checkbox', { name: /Ridge Kettle/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Continue' }))
    await user.click(await within(dialog).findByRole('button', { name: 'Continue' }))
    expect(within(dialog).getByText('Choose a reason.')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('radio', { name: /It arrived damaged/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Continue' }))
    await user.click(await within(dialog).findByRole('radio', { name: /Fieldwork credit/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Start return' }))
    expect(await within(dialog).findByText('RMA-79601', {}, { timeout: 3000 })).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Done' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('Return RMA-79601 started')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Items' })).getByText('Return started')).toBeInTheDocument()
  })

  test('only delivered items can go back', async () => {
    const user = userEvent.setup()
    reduced(<OrderDetail />)
    await user.click(screen.getByRole('button', { name: 'Return items' }))
    const dialog = await screen.findByRole('dialog', { name: 'Return items' })
    expect(within(dialog).getAllByRole('checkbox')).toHaveLength(1)
    expect(within(dialog).getAllByText('Still on its way. You can return it once it arrives.')).toHaveLength(2)
  })

  test('in transit there is nothing to return yet', () => {
    reduced(<OrderDetail order="inTransit" />)
    expect(screen.queryByRole('button', { name: 'Return items' })).not.toBeInTheDocument()
    expect(screen.getByText('On its way')).toBeInTheDocument()
  })

  test('a cancelled order shows the refund instead of a tracker', () => {
    reduced(<OrderDetail order="cancelled" />)
    expect(screen.getByText('Canceled', { selector: '[data-slot=badge]' })).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /delivery progress/ })).not.toBeInTheDocument()
    expect(screen.getByText('Refund sent to Visa •••• 4242')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Return items' })).not.toBeInTheDocument()
  })

  test('downloading the invoice holds the button pending, then confirms', async () => {
    const user = userEvent.setup()
    reduced(<OrderDetail />)
    const button = screen.getByRole('button', { name: 'Download invoice' })
    await user.click(button)
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(await screen.findByText('Downloaded FW-48213.pdf', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  test('contact support offers chat, email and a call', async () => {
    const user = userEvent.setup()
    reduced(<OrderDetail />)
    await user.click(screen.getByRole('button', { name: 'Contact support' }))
    const menu = await screen.findByRole('menu')
    expect(within(menu).getAllByRole('menuitem').map((i) => i.textContent?.trim())).toEqual(['Chat with us', 'Email help@fieldwork.co', 'Call +1 800 555 0199'])
  })

  test('embedded, it is a named section in the host’s theme', () => {
    const { container } = reduced(<OrderDetail embedded />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Order FW-48213' })).toContainElement(screen.getByRole('heading', { level: 2, name: 'Order FW-48213' }))
    expect(container.querySelector('[data-yj-theme]')).toBeNull()
  })
})

const KILN: Order = { ...ORDERS.delivered, number: 'KL-2207', email: 'lena@brandt.de', card: { brand: 'Mastercard', last4: '5100', exp: '04/29' } }

describe('Order detail block with your data', () => {
  test('your order, brand, currency and copy drive the page', () => {
    reduced(<OrderDetail order={KILN} brand={{ name: 'Kiln & Co.' }} currency="EUR" locale="de-DE" copy={{ title: (n) => `Bestellung ${n}` }} ordersHref="/orders" className="custom" data-testid="page" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Bestellung KL-2207' })).toBeInTheDocument()
    expect(screen.getByText('Kiln & Co.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'All orders' })).toHaveAttribute('href', '/orders')
    expect(within(screen.getByRole('region', { name: 'Payment' })).getByText('Total').nextSibling?.textContent).toMatch(/€$/)
    expect(screen.getByText(/Mastercard/)).toBeInTheDocument()
    expect(screen.getByTestId('page')).toHaveClass('custom')
  })

  test('onTrack answers Track package; onDownloadInvoice and onContact replace the demo toasts', async () => {
    const user = userEvent.setup()
    const onTrack = vi.fn().mockResolvedValue(false)
    const onDownloadInvoice = vi.fn().mockResolvedValue(undefined)
    const onContact = vi.fn()
    reduced(<OrderDetail order={KILN} onTrack={onTrack} onDownloadInvoice={onDownloadInvoice} onContact={onContact} support={{ email: 'hallo@kiln.co', phone: '+49 341 555 0123' }} />)
    await user.click(screen.getByRole('button', { name: /Track package/ }))
    await waitFor(() => expect(onTrack).toHaveBeenCalledWith(KILN.shipments[0]))
    await user.click(screen.getByRole('button', { name: /Download invoice/ }))
    await waitFor(() => expect(onDownloadInvoice).toHaveBeenCalledWith(KILN))
    await user.click(screen.getByRole('button', { name: /Contact support/ }))
    await user.click(await screen.findByRole('menuitem', { name: /Email hallo@kiln.co/ }))
    expect(onContact).toHaveBeenCalledWith('email', KILN)
  })

  test('onReturn gets the request, and its RMA is the one shown', async () => {
    const user = userEvent.setup()
    const onReturn = vi.fn().mockImplementation(async (request) => ({ ...request, rma: 'RMA-KILN-9' }))
    reduced(<OrderDetail order={KILN} onReturn={onReturn} />)
    await user.click(screen.getByRole('button', { name: /Return items/ }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getAllByRole('checkbox')[0]!)
    await user.click(within(dialog).getByRole('button', { name: 'Continue' }))
    await user.click(await within(dialog).findByRole('radio', { name: /changed my mind/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Continue' }))
    await user.click(await within(dialog).findByRole('button', { name: 'Start return' }))
    await waitFor(() => expect(onReturn).toHaveBeenCalledWith(expect.objectContaining({ reason: 'mind', to: 'card' })))
    expect(await within(dialog).findByText('RMA-KILN-9')).toBeInTheDocument()
  })
})
