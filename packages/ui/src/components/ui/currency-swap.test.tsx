import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { CurrencySwap, type CurrencySwapAsset, type CurrencySwapProps } from './currency-swap'

const assets: CurrencySwapAsset[] = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 60000 },
  { id: 'eth', symbol: 'ETH', name: 'Ether', price: 3000 },
  { id: 'usd', symbol: 'USD', name: 'US dollar', price: 1, decimals: 2 },
]

/* Reduced motion, so the flip and the roll land at once. */
function renderSwap(props: Partial<CurrencySwapProps> = {}, provider: { locale?: string; labels?: typeof de } = {}) {
  const result = render(
    <YoujProvider reducedMotion="always" {...provider}>
      <CurrencySwap assets={assets} {...props} />
    </YoujProvider>,
  )
  const root = result.container.querySelector<HTMLElement>('[data-slot=currency-swap]')!
  const received = () => root.querySelector('[data-slot=currency-swap-received]')!
  const rate = () => root.querySelector('[data-slot=currency-swap-rate]')!.textContent
  return { ...result, root, received, rate }
}

describe('CurrencySwap', () => {
  test('converts the amount at the rate from the prices and shows both values and the rate', () => {
    const { root, received, rate } = renderSwap({ defaultAmount: 0.5 })
    expect(screen.getByRole('textbox', { name: 'You pay' })).toHaveValue('0.5')
    expect(received()).toHaveAccessibleName('You receive')
    expect(received().textContent).toContain('10')
    expect(rate()).toBe('1 BTC = 20 ETH')
    const values = [...root.querySelectorAll('[data-slot=currency-swap-value]')].map((el) => el.textContent)
    expect(values).toEqual(['≈ $30,000.00', '≈ $30,000.00'])
  })

  test('typing an amount reports it and announces the result once it settles', async () => {
    const onAmountChange = vi.fn()
    renderSwap({ onAmountChange })
    const input = screen.getByRole('textbox', { name: 'You pay' })
    fireEvent.change(input, { target: { value: '2' } })
    expect(onAmountChange).toHaveBeenLastCalledWith(2)
    const announcer = document.querySelector('[data-slot=currency-swap-announcer]')!
    await waitFor(() => expect(announcer).toHaveTextContent('You receive 40 ETH'))
  })

  test('the named flip button trades the pair, carries the received amount over and fires onSwap', async () => {
    const user = userEvent.setup()
    const onSwap = vi.fn()
    const onFromChange = vi.fn()
    const onToChange = vi.fn()
    const onAmountChange = vi.fn()
    const { rate, received } = renderSwap({ defaultAmount: 1, onSwap, onFromChange, onToChange, onAmountChange })
    await user.click(screen.getByRole('button', { name: 'Swap currencies' }))
    expect(onSwap).toHaveBeenCalledWith({ from: 'eth', to: 'btc' })
    expect(onFromChange).toHaveBeenCalledWith('eth')
    expect(onToChange).toHaveBeenCalledWith('btc')
    expect(onAmountChange).toHaveBeenCalledWith(20)
    expect(screen.getByRole('textbox', { name: 'You pay' })).toHaveValue('20')
    expect(rate()).toBe('1 ETH = 0.05 BTC')
    expect(received().textContent).toContain('1')
  })

  test('picking the currency the other side holds flips instead of matching them', async () => {
    const user = userEvent.setup()
    const onSwap = vi.fn()
    renderSwap({ defaultAmount: 1, onSwap })
    await user.click(screen.getByRole('combobox', { name: 'Currency to pay with' }))
    await user.click(await screen.findByRole('option', { name: /ETH/ }))
    expect(onSwap).toHaveBeenCalledWith({ from: 'eth', to: 'btc' })
  })

  test('picking another currency changes the side and the rate', async () => {
    const user = userEvent.setup()
    const onToChange = vi.fn()
    const { rate } = renderSwap({ defaultAmount: 1, onToChange })
    await user.click(screen.getByRole('combobox', { name: 'Currency to receive' }))
    await user.click(await screen.findByRole('option', { name: /US dollar/ }))
    expect(onToChange).toHaveBeenCalledWith('usd')
    await waitFor(() => expect(rate()).toBe('1 BTC = 60,000 USD'))
  })

  test('rate and convert override the prices', () => {
    const { rate, received, unmount } = renderSwap({ defaultAmount: 2, rate: 10 })
    expect(rate()).toBe('1 BTC = 10 ETH')
    expect(received().textContent).toContain('20')
    unmount()
    const second = renderSwap({ defaultAmount: 2, convert: (amount) => amount * 3 })
    expect(second.received().textContent).toContain('6')
  })

  test('the action awaits onSubmit with the pair and both amounts, and is off without an amount', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { unmount } = renderSwap({ onSubmit })
    expect(screen.getByRole('button', { name: 'Swap' })).toBeDisabled()
    unmount()
    renderSwap({ onSubmit, defaultAmount: 1 })
    await user.click(screen.getByRole('button', { name: 'Swap' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 1, received: 20, from: assets[0], to: assets[1] }))
  })

  test('formats in the provider locale and reads its labels', () => {
    const { rate } = renderSwap({ defaultAmount: 1, defaultTo: 'usd' }, { locale: 'de-DE', labels: de })
    expect(rate()).toBe('1 BTC = 60.000 USD')
    expect(screen.getByRole('textbox', { name: 'Sie zahlen' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Währungen tauschen' })).toBeInTheDocument()
  })

  test('disabled blocks the field, the pickers and the flip', () => {
    const { root } = renderSwap({ disabled: true, defaultAmount: 1 })
    expect(root).toHaveAttribute('data-disabled')
    expect(screen.getByRole('textbox', { name: 'You pay' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Swap currencies' })).toBeDisabled()
  })
})
