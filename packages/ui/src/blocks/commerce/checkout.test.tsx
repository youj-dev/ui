import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Checkout, type CheckoutLine } from './checkout'
import type { Product } from './product-card'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

const cup: Product = { id: 'cup', name: 'Espresso Cup', image: 'https://example.com/cup.jpg', category: 'Cups', price: 20, rating: 5, reviews: 3, colors: [{ id: 'white', name: 'White', swatch: 'var(--color-band)' }], description: 'A cup.' }
const LINES: CheckoutLine[] = [{ product: cup, color: 'white', quantity: 3 }]
const OPTIONS = [
  { id: 'standard', label: 'Standard', price: 0 },
  { id: 'express', label: 'Express', description: 'Tomorrow', price: 10 },
]

describe('checkout with your data', () => {
  test('your lines, tax rate, currency and copy drive the summary', () => {
    reduced(<Checkout lines={LINES} taxRate={0.1} currency="EUR" locale="de-DE" copy={{ title: 'Kasse', summary: 'Übersicht' }} className="custom" data-testid="checkout" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Kasse' })).toBeInTheDocument()
    const summary = screen.getByRole('heading', { name: 'Übersicht' }).closest('[data-slot=card]') as HTMLElement
    expect(within(summary).getByText('Espresso Cup')).toBeInTheDocument()
    expect(within(summary).getByText('White · Qty 3')).toBeInTheDocument()
    // 60 subtotal, 6 tax, 66 total.
    expect(within(summary).getByText('66 €')).toBeInTheDocument()
    expect(screen.getByTestId('checkout')).toHaveClass('custom')
  })

  test('more than one shipping option shows a picker; the choice prices the order and is reported', async () => {
    const user = userEvent.setup()
    const onShippingOptionChange = vi.fn()
    reduced(<Checkout lines={LINES} taxRate={0} shippingOptions={OPTIONS} onShippingOptionChange={onShippingOptionChange} defaultValues={{ contact: { email: 'ada@kiln.de' } }} />)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(await screen.findByRole('radio', { name: /Express/ }))
    expect(onShippingOptionChange).toHaveBeenCalledWith('express')
    expect(screen.getByText('$70')).toBeInTheDocument()
  })

  test('countries come from your list, and the placed order carries lines, option and totals', async () => {
    const user = userEvent.setup()
    const onPlaceOrder = vi.fn().mockResolvedValue('K-1')
    reduced(
      <Checkout
        lines={LINES}
        taxRate={0}
        countries={{ DE: 'Deutschland' }}
        defaultValues={{ contact: { email: 'ada@kiln.de' }, shipping: { name: 'Ada', address: 'Hauptstr. 1', city: 'Leipzig', postal: '04109', phone: '+493412345678' } }}
        onPlaceOrder={onPlaceOrder}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect((await screen.findAllByRole('combobox', { name: /Country/ }))[0]).toHaveTextContent('Deutschland')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.type(await screen.findByRole('textbox', { name: /Card number/ }), '4242424242424242')
    await user.type(screen.getByRole('textbox', { name: /Expiry/ }), '08/28')
    await user.type(screen.getByRole('textbox', { name: /Security code/ }), '123')
    await user.type(screen.getByRole('textbox', { name: /Name on card/ }), 'Ada')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(await screen.findByRole('button', { name: 'Pay $60' }))
    await waitFor(() => expect(onPlaceOrder).toHaveBeenCalled())
    expect(onPlaceOrder.mock.calls[0]![0]).toMatchObject({ lines: LINES, shippingOption: { id: 'standard' }, subtotal: 60, tax: 0, total: 60, shipping: { country: 'DE' } })
    expect(await screen.findByText('K-1')).toBeInTheDocument()
  })
})
