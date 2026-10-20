import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { PaymentForm, PAYMENT_COUNTRIES } from './payment'

const NOW = new Date(2026, 9, 10)
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const box = (name: string | RegExp) => screen.getByRole('textbox', { name })
const pay = () => document.querySelector<HTMLButtonElement>('[data-slot=form-submit]')!
const labels = () => [...document.querySelectorAll('[data-slot=form-label]')].map((l) => l.textContent)

/** A whole valid card, typed. */
async function typeCard(user: ReturnType<typeof userEvent.setup>, number = '4242424242424242') {
  await user.type(box('Card number'), number)
  await user.type(box('Expiry'), '0828')
  await user.type(box('Security code'), '123')
  await user.type(box('Name on card'), 'Ada Lovelace')
}

describe('Payment form block', () => {
  test('lays out the card, the address in the country’s order and Pay with the amount', () => {
    reduced(<PaymentForm amount={49} now={NOW} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Payment details' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Card' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Billing address' })).toBeInTheDocument()
    expect(labels()).toEqual(['Card number', 'Expiry', 'Security code', 'Name on card', 'Country', 'Address', 'Apartment, suite, etc. (optional)', 'City', 'State', 'ZIP code'])
    expect(pay()).toHaveTextContent('Pay $49.00')
    expect(screen.getByText('$49.00')).toBeInTheDocument()
  })

  test('the number groups itself as its brand prints it, and the brand is shown and read out', async () => {
    const user = userEvent.setup()
    reduced(<PaymentForm now={NOW} />)
    await user.type(box('Card number'), '4242424242')
    expect(box('Card number')).toHaveValue('4242 4242 42')
    expect(screen.getByText('Visa card')).toBeInTheDocument()
    await user.clear(box('Card number'))
    await user.type(box('Card number'), '378282246310005')
    expect(box('Card number')).toHaveValue('3782 822463 10005')
    expect(box('Security code')).toHaveAttribute('placeholder', '4 digits on the front')
  })

  test('Backspace just after a gap takes the digit before it', async () => {
    const user = userEvent.setup()
    reduced(<PaymentForm now={NOW} />)
    await user.type(box('Card number'), '42424')
    expect(box('Card number')).toHaveValue('4242 4')
    await user.keyboard('{ArrowLeft}{Backspace}')
    expect(box('Card number')).toHaveValue('4244')
  })

  test('each card field hands focus on once it’s complete and valid; a lone 4 is April', async () => {
    const user = userEvent.setup()
    reduced(<PaymentForm now={NOW} />)
    await user.type(box('Card number'), '4242424242424242')
    await waitFor(() => expect(box('Expiry')).toHaveFocus())
    await user.keyboard('4')
    expect(box('Expiry')).toHaveValue('04 / ')
    await user.keyboard('29')
    await waitFor(() => expect(box('Security code')).toHaveFocus())
    await user.keyboard('123')
    await waitFor(() => expect(box('Name on card')).toHaveFocus())
  })

  test('Pay checks everything, says what’s wrong in words a person can act on and focuses the first problem', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    reduced(<PaymentForm now={NOW} onSubmit={onSubmit} />)
    await user.type(box('Card number'), '4242424242424241')
    await user.type(box('Expiry'), '0925')
    await user.type(box('ZIP code'), '941')
    await user.click(pay())
    await waitFor(() => expect(box('Card number')).toHaveFocus())
    expect(screen.getByText('Your card number is invalid.')).toBeInTheDocument()
    expect(screen.getByText('Your card’s expiry date is in the past.')).toBeInTheDocument()
    expect(screen.getByText('Your card’s security code is incomplete.')).toBeInTheDocument()
    expect(screen.getByText('Enter an address.')).toBeInTheDocument()
    expect(screen.getByText('Choose a state.')).toBeInTheDocument()
    expect(screen.getByText('Enter a ZIP code like 94110.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('a brand you don’t take is refused by name', async () => {
    const user = userEvent.setup()
    reduced(<PaymentForm now={NOW} brands={['visa', 'mastercard']} />)
    await user.type(box('Card number'), '378282246310005')
    await user.tab()
    expect(await screen.findByText('We don’t take Amex cards. Try another card.')).toBeInTheDocument()
  })

  test('another country reorders the address in its own terms and tidies its postal code', async () => {
    const user = userEvent.setup()
    reduced(<PaymentForm now={NOW} defaultAddress={{ country: 'DE' }} />)
    expect(labels().slice(4)).toEqual(['Country', 'Address', 'Apartment, suite, etc. (optional)', 'Postal code', 'City'])
    const gb = render(
      <YoujProvider reducedMotion="always">
        <PaymentForm now={NOW} defaultAddress={{ country: 'GB' }} />
      </YoujProvider>,
    )
    const postcode = within(gb.container).getByRole('textbox', { name: 'Postcode' })
    await user.type(postcode, 'e16pg')
    await user.tab()
    expect(postcode).toHaveValue('E1 6PG')
  })

  test('the first line looks the address up: arrows and Enter take one and fill the rest, then the flat or suite is next', async () => {
    const user = userEvent.setup()
    const onSearchAddress = vi.fn(async () => [
      { id: 'a', label: '27 Orchard Street', description: 'New York, NY 10002', address: { line1: '27 Orchard Street', city: 'New York', region: 'New York', postal: '10002' } },
      { id: 'b', label: '27 Orchard Road', description: 'Austin, TX 78701', address: { line1: '27 Orchard Road', city: 'Austin', region: 'Texas', postal: '78701' } },
    ])
    reduced(<PaymentForm now={NOW} onSearchAddress={onSearchAddress} />)
    const line1 = screen.getByRole('combobox', { name: 'Address' })
    await user.type(line1, '27 Orch')
    const list = await screen.findByRole('listbox')
    expect(onSearchAddress).toHaveBeenLastCalledWith('27 Orch', 'US')
    expect(within(list).getAllByRole('option')).toHaveLength(2)
    expect(screen.getByText('2 addresses found')).toBeInTheDocument()
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(line1).toHaveAttribute('aria-activedescendant', within(list).getAllByRole('option')[1]!.id)
    await user.keyboard('{Enter}')
    expect(line1).toHaveValue('27 Orchard Road')
    expect(box('City')).toHaveValue('Austin')
    expect(box('ZIP code')).toHaveValue('78701')
    await waitFor(() => expect(box(/Apartment/)).toHaveFocus())
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  test('buying for a business asks for the company and a tax number in the country’s format', async () => {
    const user = userEvent.setup()
    reduced(<PaymentForm now={NOW} defaultAddress={{ country: 'DE' }} />)
    await user.click(screen.getByRole('checkbox', { name: 'I’m buying for a business' }))
    const vat = await screen.findByRole('textbox', { name: 'VAT number' })
    await user.type(vat, 'de 123 456')
    await user.tab()
    expect(vat).toHaveValue('DE123456')
    expect(await screen.findByText('Enter a VAT number like DE123456789.')).toBeInTheDocument()
  })

  test('Pay sends the card’s digits and parts, the tidy address and the business, never the spaces', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    reduced(<PaymentForm now={NOW} onSubmit={onSubmit} defaultAddress={{ country: 'GB', line1: '7 Deansgate', city: 'Manchester', postal: 'm32bw' }} />)
    await typeCard(user, '5555555555554444')
    await user.click(screen.getByRole('checkbox', { name: 'I’m buying for a business' }))
    await user.type(await screen.findByRole('textbox', { name: 'Company name' }), 'Northwind Ltd')
    await user.type(screen.getByRole('textbox', { name: 'VAT number' }), 'GB123456789')
    await user.click(pay())
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0]![0]).toEqual({
      card: { number: '5555555555554444', brand: 'mastercard', last4: '4444', expMonth: 8, expYear: 2028, cvc: '123', name: 'Ada Lovelace' },
      address: { country: 'GB', line1: '7 Deansgate', line2: '', city: 'Manchester', region: '', postal: 'M3 2BW' },
      business: { company: 'Northwind Ltd', taxId: 'GB123456789' },
    })
  })

  test('a declined payment says why and keeps everything typed', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('Your card was declined.'))
    reduced(<PaymentForm now={NOW} onSubmit={onSubmit} defaultAddress={{ line1: '27 Orchard Street', city: 'New York', region: 'New York', postal: '10002' }} />)
    await typeCard(user)
    await user.click(pay())
    expect(await screen.findByText('Your card was declined.')).toBeInTheDocument()
    expect(screen.getByText('The payment didn’t go through')).toBeInTheDocument()
    expect(box('Card number')).toHaveValue('4242 4242 4242 4242')
  })

  test('your provider’s element takes the card fields’ place; the details go without a card, and the address is reported as it changes', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const onAddressChange = vi.fn()
    reduced(
      <PaymentForm
        now={NOW}
        card={<div data-testid="provider">Provider</div>}
        countries={PAYMENT_COUNTRIES.filter((c) => c.code === 'NL')}
        defaultAddress={{ line1: 'Keizersgracht 120', postal: '1015CW' }}
        onSubmit={onSubmit}
        onAddressChange={onAddressChange}
        business={false}
        copy={{ title: 'Upgrade to Studio', save: 'Start the plan' }}
      />,
    )
    expect(screen.getByTestId('provider')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: 'Card number' })).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: 'Upgrade to Studio' })).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'I’m buying for a business' })).toBeNull()
    await user.type(box('City'), 'Amsterdam')
    expect(onAddressChange).toHaveBeenLastCalledWith(expect.objectContaining({ country: 'NL', city: 'Amsterdam' }))
    await user.click(screen.getByRole('button', { name: 'Start the plan' }))
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ address: { country: 'NL', line1: 'Keizersgracht 120', line2: '', city: 'Amsterdam', region: '', postal: '1015 CW' }, business: null }),
    )
  })

  test('standalone, it is the page with an h1', () => {
    reduced(<PaymentForm embedded={false} now={NOW} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Payment details' })).toBeInTheDocument()
  })

  test('a donation’s amount, wording and receipt address come from props: no business purchase, only the one country, its own Pay label', () => {
    reduced(
      <PaymentForm
        amount={50}
        business={false}
        now={NOW}
        countries={PAYMENT_COUNTRIES.filter((c) => c.code === 'US')}
        copy={{ title: 'Support Riverbend Library', billing: 'Receipt address', dueToday: 'Your gift', pay: (amount: string) => `Donate ${amount}`, addressLine1: 'Street address', cardNumberPlaceholder: '0000 0000 0000 0000' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Support Riverbend Library' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Receipt address' })).toBeInTheDocument()
    expect(screen.getByText('Your gift')).toBeInTheDocument()
    expect(pay()).toHaveTextContent('Donate $50.00')
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(labels()).toContain('Street address')
    expect(box('Card number')).toHaveAttribute('placeholder', '0000 0000 0000 0000')
  })
})
