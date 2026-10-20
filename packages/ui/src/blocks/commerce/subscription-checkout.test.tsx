import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SubscriptionCheckout } from './subscription-checkout'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

async function fillPayment(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: 'Billing email' }), 'sam@northwind.dev')
  await user.type(screen.getByRole('textbox', { name: 'Name on card' }), 'Sam Lee')
  await user.type(screen.getByRole('textbox', { name: 'Card number' }), '4242424242424242')
  await user.type(screen.getByRole('textbox', { name: 'Expiry' }), '0828')
  await user.type(screen.getByRole('textbox', { name: 'CVC' }), '123')
  await user.type(screen.getByRole('textbox', { name: 'Postal code' }), '94107')
}

describe('Subscription checkout block', () => {
  test('starts on Pro, yearly, 5 seats, with the yearly saving and total in the summary', () => {
    reduced(<SubscriptionCheckout />)
    expect(screen.getByRole('heading', { level: 1, name: 'Upgrade your workspace' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^Pro/ })).toBeChecked()
    const summary = screen.getByRole('heading', { name: 'Order summary' }).closest('[data-slot=card]') as HTMLElement
    expect(within(summary).getByText('Yearly discount')).toBeInTheDocument()
    expect(within(summary).getByText('−$288.00')).toBeInTheDocument()
    expect(within(summary).getByText('Then $1,244.16 every year, until you cancel.')).toBeInTheDocument()
  })

  test('switching to monthly and changing seats reprices the order', async () => {
    const user = userEvent.setup()
    reduced(<SubscriptionCheckout />)
    await user.click(screen.getByRole('button', { name: 'Monthly' }))
    expect(await screen.findByText('Then $129.60 every month, until you cancel.')).toBeInTheDocument()
    const seats = screen.getByRole('textbox', { name: 'Seats' })
    await user.clear(seats)
    await user.type(seats, '10{Enter}')
    expect(await screen.findByText('Then $259.20 every month, until you cancel.')).toBeInTheDocument()
  })

  test('a promo code is checked, applied and removable', async () => {
    const user = userEvent.setup()
    reduced(<SubscriptionCheckout />)
    const code = screen.getByRole('textbox', { name: 'Promo code' })
    await user.type(code, 'nope{Enter}')
    expect(await screen.findByText('“NOPE” isn’t a valid code.')).toBeInTheDocument()
    await user.clear(code)
    await user.type(code, 'launch20')
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    expect(await screen.findByText('LAUNCH20 · 20% off')).toBeInTheDocument()
    expect(screen.getByText('Then $995.33 every year, until you cancel.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove LAUNCH20' }))
    expect(screen.getByRole('textbox', { name: 'Promo code' })).toBeInTheDocument()
  })

  test('payment is validated, formats as typed, and subscribing lands on the confirmation', async () => {
    const user = userEvent.setup()
    const onSubscribe = vi.fn()
    reduced(<SubscriptionCheckout onSubscribe={onSubscribe} />)
    await user.click(screen.getByRole('button', { name: 'Continue to payment' }))
    expect(await screen.findByText('Placeholder payment form')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Subscribe · $1,244.16' }))
    expect(await screen.findByText('Enter the 16 digits on the card.')).toBeInTheDocument()
    expect(screen.getByText('Use MM/YY, like 08/28.')).toBeInTheDocument()
    expect(onSubscribe).not.toHaveBeenCalled()

    await fillPayment(user)
    expect(screen.getByRole('textbox', { name: 'Card number' })).toHaveValue('4242 4242 4242 4242')
    expect(screen.getByRole('textbox', { name: 'Expiry' })).toHaveValue('08/28')
    await user.click(await screen.findByRole('button', { name: 'Subscribe · $1,244.16' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'You’re on Pro' })).toBeInTheDocument()
    expect(screen.getByText('Card ending 4242')).toBeInTheDocument()
    expect(onSubscribe).toHaveBeenCalledWith(expect.objectContaining({ plan: 'pro', period: 'yearly', seats: 5, total: 1244.16, payment: expect.objectContaining({ email: 'sam@northwind.dev', last4: '4242' }) }))
    expect(onSubscribe.mock.calls[0]![0].payment).not.toHaveProperty('card')
  })

  test('the tax line follows the country', async () => {
    const user = userEvent.setup()
    reduced(<SubscriptionCheckout />)
    await user.click(screen.getByRole('button', { name: 'Continue to payment' }))
    await user.click(await screen.findByRole('combobox', { name: 'Country' }))
    await user.click(await screen.findByRole('option', { name: 'Germany' }))
    expect(await screen.findByText('VAT (19%)')).toBeInTheDocument()
  })

  test('every string comes through copy', () => {
    reduced(<SubscriptionCheckout copy={{ title: 'Passer à la version supérieure', summary: 'Récapitulatif' }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Passer à la version supérieure' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Récapitulatif' })).toBeInTheDocument()
  })
})

describe('subscription checkout with your data', () => {
  test('brand, currency, countries and the prefilled payment come from props', async () => {
    const user = userEvent.setup()
    reduced(
      <SubscriptionCheckout
        brand={{ name: 'Lattice' }}
        currency="EUR"
        locale="de-DE"
        countries={[{ code: 'DE', name: 'Deutschland', taxLabel: 'MwSt.', taxRate: 0.19 }]}
        defaultPayment={{ email: 'mila@lattice.design' }}
        className="custom"
        data-testid="page"
      />,
    )
    expect(screen.getByText('Lattice')).toBeInTheDocument()
    expect(screen.getByTestId('page')).toHaveClass('custom')
    expect(screen.getByTestId('page')).toHaveTextContent('€')
    expect(screen.getByTestId('page')).toHaveTextContent(/MwSt\./)
    await user.click(screen.getByRole('button', { name: 'Continue to payment' }))
    expect(await screen.findByRole('textbox', { name: 'Billing email' })).toHaveValue('mila@lattice.design')
  })

  test('controlled plan and seats report changes and follow their props', async () => {
    const user = userEvent.setup()
    const onPlanChange = vi.fn()
    const onSeatsChange = vi.fn()
    reduced(<SubscriptionCheckout plan="pro" onPlanChange={onPlanChange} seats={5} onSeatsChange={onSeatsChange} />)
    await user.click(screen.getByRole('radio', { name: /Business/ }))
    expect(onPlanChange).toHaveBeenCalledWith('business')
    expect(screen.getByRole('radio', { name: /^Pro/ })).toBeChecked()
    await user.click(screen.getByRole('button', { name: /Increase/ }))
    expect(onSeatsChange).toHaveBeenCalledWith(6)
  })
})
