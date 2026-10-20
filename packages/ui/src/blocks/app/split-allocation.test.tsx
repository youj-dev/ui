import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SplitAllocation } from './split-allocation'
import { equalShares, parseDecimal } from './split-allocation/model'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const custom = (amounts: [number, number, number]) => ({
  defaultMode: 'custom' as const,
  defaultLines: [
    { category: 'groceries', amount: amounts[0] },
    { category: 'household', amount: amounts[1] },
    { category: 'gifts', amount: amounts[2] },
  ],
})
const status = () => document.querySelector('[data-slot=split-status]')
const save = () => screen.getByRole('button', { name: 'Save split' })

describe('split allocation card', () => {
  test('an equal split divides in whole cents and gives the leftover cent to the last row', () => {
    reduced(<SplitAllocation />)
    expect(screen.getByRole('heading', { level: 2, name: 'Split transaction' })).toBeInTheDocument()
    expect(screen.getByText('Groceries amount').parentElement).toHaveTextContent('42.66')
    expect(screen.getByText('Household amount').parentElement).toHaveTextContent('42.66')
    expect(screen.getByText('Gifts amount').parentElement).toHaveTextContent('42.68')
    expect(status()).toHaveTextContent('100% of $128.00')
    expect(save()).toBeEnabled()
  })

  test('the shares of an equal split always add up to the amount', () => {
    for (const [total, count] of [[12800, 3], [1, 3], [10000, 7], [999, 2], [0, 4]] as const) {
      const shares = equalShares(total, count)
      expect(shares).toHaveLength(count)
      expect(shares.reduce((a, b) => a + b, 0)).toBe(total)
      expect(shares.slice(0, -1).every((s) => s === shares[0])).toBe(true)
    }
  })

  test('reads numbers the way the locale writes them', () => {
    expect(parseDecimal('1,234.50', 'en-US')).toBe(1234.5)
    expect(parseDecimal('1.234,50', 'de-DE')).toBe(1234.5)
    expect(parseDecimal('', 'en-US')).toBe(0)
    expect(parseDecimal('12a', 'en-US')).toBeNull()
  })

  test('a custom amount and its percent stay in step, whichever is typed', async () => {
    const user = userEvent.setup()
    reduced(<SplitAllocation {...custom([64, 38.4, 12.8])} />)
    const amount = screen.getByRole('textbox', { name: 'Gifts amount' })
    const percent = screen.getByRole('textbox', { name: 'Gifts percent' })
    expect(amount).toHaveValue('12.80')
    expect(percent).toHaveValue('10')
    await user.clear(amount)
    await user.type(amount, '32')
    await user.tab()
    expect(percent).toHaveValue('25')
    await user.clear(percent)
    await user.type(percent, '50')
    await user.tab()
    expect(amount).toHaveValue('64.00')
  })

  test('says what is left to allocate and holds Save back with it as the reason', () => {
    reduced(<SplitAllocation {...custom([64, 38.4, 12.8])} defaultLines={[{ category: 'groceries', amount: 64 }, { category: 'household', amount: 38.4 }, { category: 'gifts', amount: 0 }]} />)
    expect(status()).toHaveTextContent('$25.60 left to allocate')
    expect(save()).toBeDisabled()
    expect(save()).toHaveAccessibleDescription('$25.60 left to allocate')
  })

  test('says how far over it is and holds Save back', async () => {
    const user = userEvent.setup()
    reduced(<SplitAllocation {...custom([64, 38.4, 25.6])} />)
    expect(status()).toHaveTextContent('100% of $128.00')
    const amount = screen.getByRole('textbox', { name: 'Gifts amount' })
    await user.clear(amount)
    await user.type(amount, '29.6')
    expect(status()).toHaveTextContent('$4.00 over')
    expect(save()).toBeDisabled()
    await user.clear(amount)
    await user.type(amount, '25.6')
    expect(status()).toHaveTextContent('100% of $128.00')
    expect(save()).toBeEnabled()
  })

  test('switching back to an equal split evens the rows out, and rows can be added and removed', async () => {
    const user = userEvent.setup()
    reduced(<SplitAllocation {...custom([100, 20, 8])} />)
    await user.click(screen.getByRole('button', { name: 'Equal split' }))
    expect(screen.getByText('Gifts amount').parentElement).toHaveTextContent('42.68')
    await user.click(screen.getByRole('button', { name: 'Add category' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByText('Groceries amount').parentElement).toHaveTextContent('32.00')
    await user.click(screen.getByRole('button', { name: 'Remove Gifts' }))
    await user.click(screen.getByRole('button', { name: 'Remove Household' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    for (const remove of screen.getAllByRole('button', { name: /^Remove/ })) expect(remove).toBeDisabled()
  })

  test('a removed row leaves its amount unallocated in a custom split', async () => {
    const user = userEvent.setup()
    reduced(<SplitAllocation {...custom([64, 38.4, 25.6])} />)
    await user.click(screen.getByRole('button', { name: 'Remove Gifts' }))
    expect(status()).toHaveTextContent('$25.60 left to allocate')
    await user.click(screen.getByRole('button', { name: 'Add category' }))
    expect(status()).toHaveTextContent('100% of $128.00')
  })

  test('saves the rows once they add up, and tells the app the new rows as they change', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const onLinesChange = vi.fn()
    reduced(<SplitAllocation {...custom([64, 38.4, 25.6])} onSave={onSave} onLinesChange={onLinesChange} />)
    const amount = screen.getByRole('textbox', { name: 'Household amount' })
    await user.clear(amount)
    await user.type(amount, '40')
    expect(onLinesChange).toHaveBeenLastCalledWith([
      { category: 'groceries', amount: 64 },
      { category: 'household', amount: 40 },
      { category: 'gifts', amount: 25.6 },
    ])
    expect(save()).toBeDisabled()
    await user.clear(amount)
    await user.type(amount, '38.4')
    await user.click(save())
    await waitFor(() => expect(onSave).toHaveBeenCalledWith([
      { category: 'groceries', amount: 64 },
      { category: 'household', amount: 38.4 },
      { category: 'gifts', amount: 25.6 },
    ]))
  })

  test('formats in the locale and the currency it is given, and copy rewrites the text', () => {
    reduced(<SplitAllocation locale="de-DE" format={{ style: 'currency', currency: 'EUR' }} copy={{ title: 'Aufteilen', left: (a) => `Noch ${a}` }} total={{ label: 'Linden Hardware', detail: 'Household', date: '2026-10-02', amount: 86.5 }} />)
    expect(screen.getByRole('heading', { name: 'Aufteilen' })).toBeInTheDocument()
    expect(screen.getAllByText(/86,50/).length).toBeGreaterThan(1)
    expect(status()).toHaveTextContent(/^100% of 86,50\s€$/)
  })

  test('format, total and copy drive it: hours in tenths, the unit beside each figure, the label and detail as given', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    reduced(
      <SplitAllocation
        format={{ style: 'unit', unit: 'hour', unitDisplay: 'narrow', maximumFractionDigits: 1 }}
        total={{ label: 'Harvest festival', detail: 'Volunteer shifts', date: '2026-10-18', amount: 48 }}
        categories={[
          { id: 'tent', name: 'Food tent' },
          { id: 'kids', name: 'Kids corner' },
          { id: 'park', name: 'Parking' },
        ]}
        defaultMode="custom"
        defaultLines={[
          { category: 'tent', amount: 20.5 },
          { category: 'kids', amount: 20.5 },
        ]}
        copy={{ save: 'Save plan', left: (a: string) => `${a} left to assign` }}
        onSave={onSave}
      />,
    )
    expect(screen.getByText('Harvest festival')).toBeInTheDocument()
    expect(screen.getByText('Volunteer shifts · Oct 18')).toBeInTheDocument()
    expect(status()).toHaveTextContent('7h left to assign')
    expect(screen.getByRole('textbox', { name: 'Food tent amount' })).toHaveValue('20.5')
    expect(screen.getByRole('button', { name: 'Save plan' })).toBeDisabled()
    const kids = screen.getByRole('textbox', { name: 'Kids corner amount' })
    await user.clear(kids)
    await user.type(kids, '27.5')
    await user.tab()
    expect(status()).toHaveTextContent('100% of 48h')
    await user.click(screen.getByRole('button', { name: 'Save plan' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith([
      { category: 'tent', amount: 20.5 },
      { category: 'kids', amount: 27.5 },
    ]))
  })

  test('Cancel puts the rows back as they opened', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    reduced(<SplitAllocation {...custom([64, 38.4, 25.6])} onCancel={onCancel} />)
    await user.click(screen.getByRole('button', { name: 'Remove Gifts' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(status()).toHaveTextContent('100% of $128.00')
  })

  test('its bar is decorative and the standalone page is headed by an h1', () => {
    const { container } = reduced(<SplitAllocation embedded={false} />)
    expect(container.querySelector('[data-slot=split-bar]')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('heading', { level: 1, name: 'Split transaction' })).toBeInTheDocument()
  })
})
