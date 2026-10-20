import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ChipFilters } from './chip-filters'
import { checkToken, countIn, DEFAULT_COPY, fromTokens, histogram, OPTIONS, toTokens } from './chip-filters/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const chips = () => [...screen.getByRole('list', { name: 'Active filters' }).querySelectorAll('li:not([inert]) [data-slot=query-chip-edit]')].map((b) => b.textContent)
const thumb = (name: string) => screen.getAllByRole('slider', { hidden: true }).find((el) => el.getAttribute('aria-label') === name)!

const COPY = { ...DEFAULT_COPY, locale: 'en-US' }

describe('Chip filters block', () => {
  test('leads with the search, the result in the head, then basket value and fulfilment', () => {
    reduced(<ChipFilters />)
    const heading = screen.getByRole('heading', { level: 2, name: 'Orders' })
    expect(heading).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Search orders' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Basket value' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Fulfillment' })).toHaveAccessibleDescription('2 of 4 states')
    expect(chips()).toEqual(['total:25..180', 'state:in(paid,shipped)'])
    const matched = Math.round(countIn(OPTIONS[0]!.bins, [25, 180])) + Math.round(countIn(OPTIONS[2]!.bins, [25, 180]))
    // The count sits in the head, and its spoken text (the Counter's sr-only copy) is the result.
    const head = heading.closest<HTMLElement>('[data-slot=card-header]')!
    expect(within(head).getAllByText(new Intl.NumberFormat('en-US').format(matched)).some((el) => el.classList.contains('sr-only'))).toBe(true)
    const total = OPTIONS.reduce((sum, s) => sum + s.bins.reduce((a, b) => a + b, 0), 0)
    expect(within(head).getByText(`of ${new Intl.NumberFormat('en-US').format(total)} orders`)).toBeInTheDocument()
  })

  test('ticking a state updates the summary, the all box and the query chip', async () => {
    const user = userEvent.setup()
    reduced(<ChipFilters />)
    const all = screen.getByRole('checkbox', { name: 'All states' })
    expect(all).toHaveAttribute('aria-checked', 'mixed')
    await user.click(screen.getByRole('checkbox', { name: /^returned/ }))
    expect(screen.getByRole('group', { name: 'Fulfillment' })).toHaveAccessibleDescription('3 of 4 states')
    expect(chips()).toEqual(['total:25..180', 'state:in(paid,shipped,returned)'])
    await user.click(all)
    expect(all).toHaveAttribute('aria-checked', 'true')
    expect(chips()).toEqual(['total:25..180'])
  })

  test('moving a thumb rewrites the basket-value chip', () => {
    reduced(<ChipFilters />)
    fireEvent.keyDown(thumb('Maximum basket value'), { key: 'ArrowLeft' })
    expect(chips()).toEqual(['total:25..179', 'state:in(paid,shipped)'])
  })

  test('typing a search moves the controls; a bad token is refused with its reason', async () => {
    const user = userEvent.setup()
    reduced(<ChipFilters />)
    const field = screen.getByRole('textbox', { name: 'Search orders' })
    await user.type(field, 'total:40..90{Enter}')
    expect(thumb('Minimum basket value')).toHaveAttribute('aria-valuenow', '40')
    expect(thumb('Maximum basket value')).toHaveAttribute('aria-valuenow', '90')
    expect(chips()).toEqual(['total:40..90', 'state:in(paid,shipped)'])
    await user.type(field, 'color:red{Enter}')
    expect(screen.getByText('There’s no color filter here. Use total or state.')).toHaveAttribute('role', 'alert')
  })

  test('removing a chip lifts its filter; Clear filters clears them all', async () => {
    const user = userEvent.setup()
    reduced(<ChipFilters />)
    await user.click(screen.getByRole('button', { name: 'Remove state:in(paid,shipped) filter' }))
    expect(screen.getByRole('checkbox', { name: 'All states' })).toHaveAttribute('aria-checked', 'true')
    const clear = screen.getByRole('button', { name: 'Clear filters' })
    await user.click(clear)
    expect(chips()).toEqual([])
    expect(clear).toBeDisabled()
    expect(thumb('Minimum basket value')).toHaveAttribute('aria-valuenow', '0')
    expect(thumb('Maximum basket value')).toHaveAttribute('aria-valuenow', '320')
  })

  test('Save search runs the callback with the filters', async () => {
    const user = userEvent.setup()
    const onSaveView = vi.fn()
    reduced(<ChipFilters onSaveView={onSaveView} />)
    await user.click(screen.getByRole('button', { name: 'Save search' }))
    expect(onSaveView).toHaveBeenCalledWith({ range: [25, 180], selected: ['paid', 'shipped'] })
  })

  test('copy rewrites the strings', () => {
    reduced(<ChipFilters copy={{ title: 'Bestellungen', search: 'Bestellungen suchen', allOptions: 'Alle Status' }} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Bestellungen' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Bestellungen suchen' })).toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Fulfillment' })).getByRole('checkbox', { name: 'Alle Status' })).toBeInTheDocument()
  })

  test('the query round-trips the filters, and checks what it is given', () => {
    const filters = { range: [25, 180] as [number, number], selected: ['paid', 'returned'] }
    expect(fromTokens(toTokens(filters, OPTIONS), OPTIONS)).toEqual(filters)
    expect(fromTokens(['total:300..60'], OPTIONS).range).toEqual([60, 300])
    expect(fromTokens(['total:€30..€75.4'], OPTIONS).range).toEqual([30, 75])
    expect(checkToken('state:in(paid, nope)', OPTIONS, COPY)).toBe('State takes paid, packed, shipped, returned.')
    expect(checkToken('total:cheap', OPTIONS, COPY)).toBe(COPY.invalidRange)
    expect(checkToken('state:shipped', OPTIONS, COPY)).toBeUndefined()
  })
  test('your fields, groups and format replace the orders: the query speaks their words', async () => {
    const user = userEvent.setup()
    const onSaveView = vi.fn()
    const fields = { range: { id: 'year', min: 1950, max: 2025, step: 1, bins: 25, ticks: [1950, 2025] }, choice: { id: 'format' } }
    const options = [
      { id: 'print', label: 'Print book', token: 'print', bins: histogram([[2008, 0.003, 1]], 1_000, fields.range) },
      { id: 'ebook', label: 'E-book', token: 'ebook', bins: histogram([[2016, 0.002, 1]], 500, fields.range) },
    ]
    reduced(
      <ChipFilters
        fields={fields}
        options={options}
        format={String}
        onSaveView={onSaveView}
        defaultValue={{ range: [1990, 2020], selected: ['print'] }}
        copy={{ title: 'Catalog', search: 'Search the catalog', rangeLabel: 'Year published', choiceLabel: 'Format', allOptions: 'All formats', ofTotal: (total) => `of ${total} titles` }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Catalog' })).toBeInTheDocument()
    expect(chips()).toEqual(['year:1990..2020', 'format:in(print)'])
    expect(within(screen.getByRole('group', { name: 'Format' })).getByRole('checkbox', { name: /^E-book/ })).toBeInTheDocument()
    expect(thumb('Minimum year published')).toHaveAttribute('aria-valuenow', '1990')
    expect(screen.getByText(/^of [\d,]+ titles$/)).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Search the catalog' }), 'year:1960..1970{Enter}')
    expect(thumb('Maximum year published')).toHaveAttribute('aria-valuenow', '1970')
    await user.type(screen.getByRole('textbox', { name: 'Search the catalog' }), 'state:x{Enter}')
    expect(screen.getByText('There’s no state filter here. Use year or format.')).toHaveAttribute('role', 'alert')
    await user.click(screen.getByRole('button', { name: 'Save search' }))
    expect(onSaveView).toHaveBeenCalledWith({ range: [1960, 1970], selected: ['print'] })
  })

  test('the tokens follow the fields you name', () => {
    const fields = { range: { id: 'salary', min: 40, max: 240, step: 1, bins: 40, ticks: [40, 240] }, choice: { id: 'team' } }
    const options = [
      { id: 'eng', label: 'Engineering', token: 'engineering', bins: [] },
      { id: 'design', label: 'Design', token: 'design', bins: [] },
    ]
    const value = { range: [90, 140] as [number, number], selected: ['design'] }
    expect(toTokens(value, options, fields)).toEqual(['salary:90..140', 'team:in(design)'])
    expect(fromTokens(['salary:$90..$140', 'team:design'], options, fields)).toEqual(value)
    expect(checkToken('state:in(paid)', options, COPY, fields)).toBe('There’s no state filter here. Use salary or team.')
    expect(checkToken('salary:cheap', options, COPY, fields)).toBe(COPY.invalidRange)
  })
})
