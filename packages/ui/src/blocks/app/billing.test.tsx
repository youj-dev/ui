import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Billing } from './billing'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('Billing block', () => {
  test('names its landmarks and shows the plan, card and invoices', () => {
    reduced(<Billing embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Billing' })).toBeInTheDocument()
    expect(screen.getByText('Growth', { selector: '[data-slot=card-title]' })).toBeInTheDocument()
    expect(screen.getByText(/ending in/).parentElement).toHaveTextContent('Visa •••• ending in 4242')
    const table = screen.getByRole('table', { name: 'Invoices' })
    expect(within(table).getAllByRole('row')).toHaveLength(8)
    expect(screen.getByRole('button', { name: 'Download TRN-0009 as PDF' })).toBeInTheDocument()
  })

  test('a failed charge raises an alert; retrying settles it and the alert goes', async () => {
    const user = userEvent.setup()
    reduced(<Billing embedded={false} />)
    expect(screen.getByText('The Sep 2026 payment failed')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry payment' }))
    await waitFor(() => expect(screen.queryByText('The Sep 2026 payment failed')).not.toBeInTheDocument(), { timeout: 3000 })
    const row = screen.getByRole('cell', { name: 'TRN-0010' }).closest('tr')!
    expect(within(row).getByText('Paid')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Retry payment for/ })).not.toBeInTheDocument()
  })

  test('without a failed charge there is no alert', () => {
    reduced(<Billing embedded={false} failedPayment={false} />)
    expect(screen.queryByText(/payment failed/)).not.toBeInTheDocument()
  })

  test('the status filter narrows the invoices', async () => {
    const user = userEvent.setup()
    reduced(<Billing embedded={false} />)
    await user.click(screen.getByRole('button', { name: /^Open/ }))
    await waitFor(() => expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2))
    expect(screen.getByRole('cell', { name: 'TRN-0010' })).toBeInTheDocument()
  })

  test('downloading an invoice holds the button pending, then confirms', async () => {
    const user = userEvent.setup()
    reduced(<Billing embedded={false} />)
    const download = screen.getByRole('button', { name: 'Download TRN-0009 as PDF' })
    await user.click(download)
    expect(download).toHaveAttribute('aria-busy', 'true')
    expect(await screen.findByText('Downloaded TRN-0009.pdf', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  test('changing the plan states the new total, then updates the plan card', async () => {
    const user = userEvent.setup()
    reduced(<Billing embedded={false} failedPayment={false} />)
    await user.click(screen.getByRole('button', { name: 'Change plan' }))
    const dialog = await screen.findByRole('dialog', { name: 'Change plan' })
    const confirm = within(dialog).getByRole('button', { name: 'Confirm change' })
    expect(confirm).toBeDisabled()
    await user.click(within(dialog).getByRole('radio', { name: /Scale/ }))
    await user.click(within(dialog).getByRole('button', { name: /Annual/ }))
    expect(within(dialog).getByText('From Oct 1: $6,720 a year.')).toBeInTheDocument()
    await user.click(confirm)
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Change plan' })).not.toBeInTheDocument(), { timeout: 3000 })
    expect(screen.getByText('Scale', { selector: '[data-slot=card-title]' })).toBeInTheDocument()
    expect(screen.getByText('Billed yearly')).toBeInTheDocument()
  })

  test('the card form checks its fields before saving', async () => {
    const user = userEvent.setup()
    reduced(<Billing embedded={false} />)
    await user.click(screen.getByRole('button', { name: 'Update' }))
    const dialog = await screen.findByRole('dialog', { name: 'Update payment method' })
    await user.click(within(dialog).getByRole('button', { name: 'Save card' }))
    expect(within(dialog).getByText('Enter the full card number.')).toBeInTheDocument()
    await user.type(within(dialog).getByRole('textbox', { name: 'Name on card' }), 'Ines Carvalho')
    await user.type(within(dialog).getByRole('textbox', { name: 'Card number' }), '5555 4444 3333 1111')
    await user.type(within(dialog).getByRole('textbox', { name: 'Expiry' }), '11/29')
    await user.type(within(dialog).getByRole('textbox', { name: 'CVC' }), '123')
    await user.click(within(dialog).getByRole('button', { name: 'Save card' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Update payment method' })).not.toBeInTheDocument(), { timeout: 3000 })
    expect(screen.getByText('Expires 11/2029')).toBeInTheDocument()
    expect(screen.getByText(/ending in/).parentElement).toHaveTextContent('Mastercard •••• ending in 1111')
  })

  test('by default, a page of the app’s frame: the shared header holds the title, with no top bar, in the host’s theme', () => {
    const { container } = reduced(<Billing />)
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
    expect(screen.queryByText('Tern')).not.toBeInTheDocument()
    expect(container.querySelector('[data-slot=app-page-header]')).toContainElement(screen.getByRole('heading', { level: 1, name: 'Billing' }))
    expect(container.querySelector('[data-yj-theme]')).toBeNull()
  })

  describe('with your data', () => {
    const plans = [
      { id: 'basic', name: 'Basic', blurb: 'One kitchen', price: 30 },
      { id: 'chef', name: 'Chef', blurb: 'Every kitchen', price: 90 },
    ]
    const invoices = [{ id: 'x1', number: 'KIT-7', date: '1 Sep 2026', period: 'Sep 2026', amount: 150, status: 'failed' as const }]

    test('props drive the plan, amounts, brand and copy', () => {
      reduced(<Billing embedded={false} brand={{ name: 'Kitchenly' }} plans={plans} defaultPlan="basic" seats={5} invoices={invoices} locale="de-DE" currency="EUR" copy={{ title: 'Abrechnung' }} />)
      expect(screen.getByRole('heading', { level: 1, name: 'Abrechnung' })).toBeInTheDocument()
      expect(screen.getByText('Kitchenly')).toBeInTheDocument()
      expect(screen.getByText('Basic plan')).toBeInTheDocument()
      expect(screen.getByText('KIT-7')).toBeInTheDocument()
      expect(screen.getAllByText('150 €').length).toBeGreaterThan(0)
    })

    test('callbacks get the payload; a rejected plan change shows its message', async () => {
      const user = userEvent.setup()
      const onRetryPayment = vi.fn()
      const onChangePlan = vi.fn().mockRejectedValue(new Error('Contact your admin to upgrade.'))
      reduced(<Billing embedded={false} plans={plans} defaultPlan="basic" invoices={invoices} onRetryPayment={onRetryPayment} onChangePlan={onChangePlan} />)

      await user.click(screen.getByRole('button', { name: 'Retry payment' }))
      await waitFor(() => expect(onRetryPayment).toHaveBeenCalledWith(invoices[0]))

      await user.click(screen.getByRole('button', { name: 'Change plan' }))
      const dialog = await screen.findByRole('dialog')
      await user.click(within(dialog).getByRole('radio', { name: /Chef/ }))
      await user.click(within(dialog).getByRole('button', { name: 'Confirm change' }))
      await waitFor(() => expect(onChangePlan).toHaveBeenCalledWith({ plan: plans[1], cycle: 'monthly' }))
      expect(await within(dialog).findByText('Contact your admin to upgrade.')).toBeInTheDocument()
    })

    test('the plan can be controlled', () => {
      reduced(<Billing embedded={false} plans={plans} plan="chef" cycle="annual" invoices={[]} />)
      expect(screen.getByText('Chef plan')).toBeInTheDocument()
      expect(screen.getByText('Billed yearly')).toBeInTheDocument()
    })

    test('loading, error and empty states', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      const { rerender } = reduced(<Billing embedded={false} loading invoices={[]} />)
      expect(screen.getByText('Loading invoices…')).toBeInTheDocument()
      rerender(
        <YoujProvider reducedMotion="always">
          <Billing embedded={false} invoices={[]} error="Stripe is unreachable." onRetry={onRetry} />
        </YoujProvider>,
      )
      expect(screen.getByText(/No invoices yet/)).toBeInTheDocument()
      expect(screen.getByText('Stripe is unreachable.')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Retry' }))
      expect(onRetry).toHaveBeenCalled()
    })
  })
})
