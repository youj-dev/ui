import { useState } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { SpreadsheetTable, type SpreadsheetTableProps } from './spreadsheet'
import { DEFAULT_COPY, type SpreadsheetTableRow } from './spreadsheet/data'

const ITEMS: SpreadsheetTableRow[] = [
  { id: 'i1', ref: 'TN-100', name: 'Tent', category: 'Camp', location: 'A-01-1', quantity: 12, threshold: 5, unitValue: 200 },
  { id: 'i2', ref: 'RP-200', name: 'Rope', category: 'Climb', location: 'B-02-1', quantity: 3, threshold: 10, unitValue: 150 },
  { id: 'i3', ref: 'HL-300', name: 'Headlamp', category: 'Accessories', location: 'C-03-2', quantity: 40, threshold: 15, unitValue: 25.5 },
]

function renderSheet(props: Partial<SpreadsheetTableProps> = {}) {
  const user = userEvent.setup()
  render(
    <YoujProvider reducedMotion="always" locale="en-US">
      <SpreadsheetTable rows={ITEMS} {...props} />
    </YoujProvider>,
  )
  return user
}

const grid = () => screen.getByRole('grid')
const rowOf = (sku: string) => within(grid()).getAllByRole('row').find((row) => row.textContent?.includes(sku))!
/** The row's cells in column order: 0 is the row number, 1 the SKU, then Item, Category, Bin, On hand, Reorder at, Unit cost, Value. */
const cellOf = (sku: string, index: number) => within(rowOf(sku)).getAllByRole('gridcell')[index]!
const bar = () => screen.getByRole('textbox', { name: /^Contents of / })

describe('SpreadsheetTable', () => {
  test('names its section and grid by its title, shows the lines it is given and totals what is in view', () => {
    renderSheet()
    expect(screen.getByRole('region', { name: 'Inventory' })).toBeInTheDocument()
    expect(grid()).toHaveAccessibleName('Inventory')
    for (const item of ITEMS) expect(within(grid()).getByText(item.ref)).toBeInTheDocument()
    const totals = grid().querySelector('tfoot')!
    expect(totals).toHaveTextContent('Total')
    expect(totals).toHaveTextContent('55') // units: 12 + 3 + 40
    expect(totals).toHaveTextContent('$3,870.00') // 2400 + 450 + 1020
    expect(totals).toHaveTextContent('1 line low')
    expect(cellOf('RP-200', 5)).toHaveTextContent('Low stock')
  })

  test('copy and currency rewrite what it says', () => {
    renderSheet({ currency: 'EUR', copy: { title: 'Stock', total: 'Sum' } })
    expect(screen.getByRole('heading', { name: 'Stock' })).toBeInTheDocument()
    expect(grid().querySelector('tfoot')).toHaveTextContent('Sum')
    expect(cellOf('TN-100', 7)).toHaveTextContent('€200.00')
  })

  test('the formula bar names the active cell, shows its value, and a worked-out cell its formula', async () => {
    const user = renderSheet()
    expect(screen.getByRole('status', { name: 'Cell' })).toHaveTextContent('A1')
    await user.click(cellOf('RP-200', 5))
    expect(screen.getByRole('status', { name: 'Cell' })).toHaveTextContent('E2')
    expect(bar()).toHaveValue('3')
    await user.click(cellOf('RP-200', 8))
    expect(bar()).toHaveValue('=E2*G2')
    expect(bar()).toHaveAttribute('readonly')
  })

  test('an edit in a cell goes to onEdit, and undo and redo send it back and forth', async () => {
    const onEdit = vi.fn()
    const user = renderSheet({ onEdit })
    await user.dblClick(cellOf('TN-100', 5))
    const input = within(grid()).getByRole('textbox')
    await user.clear(input)
    await user.type(input, '20{Enter}')
    await waitFor(() => expect(onEdit).toHaveBeenCalledWith([expect.objectContaining({ field: 'quantity', value: 20, previousValue: 12, row: expect.objectContaining({ id: 'i1', quantity: 20 }) })]))
    await waitFor(() => expect(cellOf('TN-100', 5)).toHaveTextContent('20'))

    await user.click(cellOf('TN-100', 2))
    await user.keyboard('{Meta>}z{/Meta}')
    await waitFor(() => expect(cellOf('TN-100', 5)).toHaveTextContent('12'))
    expect(onEdit).toHaveBeenLastCalledWith([expect.objectContaining({ field: 'quantity', value: 12, previousValue: 20 })])

    await user.click(screen.getByRole('button', { name: 'Redo' }))
    await waitFor(() => expect(cellOf('TN-100', 5)).toHaveTextContent('20'))
    expect(onEdit).toHaveBeenLastCalledWith([expect.objectContaining({ field: 'quantity', value: 20 })])
  })

  test('typing in the formula bar edits the active cell, and a value that does not fit says why', async () => {
    const onEdit = vi.fn()
    const user = renderSheet({ onEdit })
    await user.click(cellOf('HL-300', 7))
    await user.clear(bar())
    await user.type(bar(), 'abc{Enter}')
    expect(bar()).toHaveAccessibleDescription('Enter an amount, 0 or more.')
    expect(bar()).toHaveAttribute('aria-invalid', 'true')
    expect(onEdit).not.toHaveBeenCalled()
    await user.clear(bar())
    await user.type(bar(), '27.5{Enter}')
    await waitFor(() => expect(onEdit).toHaveBeenCalledWith([expect.objectContaining({ field: 'unitValue', value: 27.5, previousValue: 25.5 })]))
    expect(cellOf('HL-300', 7)).toHaveTextContent('$27.50')
  })

  test('a block pasted from a spreadsheet lands from the active cell on, as one change, skipping what does not fit', async () => {
    const onEdit = vi.fn()
    const user = renderSheet({ onEdit })
    await user.click(cellOf('TN-100', 5))
    fireEvent.paste(document.activeElement!, { clipboardData: { getData: () => '30\t8\n7\tlots\n' } })
    await waitFor(() => expect(onEdit).toHaveBeenCalledTimes(1))
    const edits = onEdit.mock.calls[0]![0]
    expect(edits).toEqual([
      expect.objectContaining({ field: 'quantity', value: 30, row: expect.objectContaining({ id: 'i1' }) }),
      expect.objectContaining({ field: 'threshold', value: 8, row: expect.objectContaining({ id: 'i1' }) }),
      expect.objectContaining({ field: 'quantity', value: 7, row: expect.objectContaining({ id: 'i2' }) }),
    ])
    expect(cellOf('RP-200', 5)).toHaveTextContent('7')
    expect(cellOf('RP-200', 6)).toHaveTextContent('10')
  })

  test('an app that stores each edit and passes its rows back can still undo', async () => {
    const saved = vi.fn()
    function App() {
      const [items, setItems] = useState(ITEMS)
      return (
        <SpreadsheetTable
          rows={items}
          onEdit={(edits) => {
            saved(edits)
            setItems((list) => list.map((item) => edits.find((e) => e.row.id === item.id)?.row ?? item))
          }}
        />
      )
    }
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always" locale="en-US">
        <App />
      </YoujProvider>,
    )
    await user.click(cellOf('RP-200', 5))
    fireEvent.paste(document.activeElement!, { clipboardData: { getData: () => '9' } })
    await waitFor(() => expect(cellOf('RP-200', 5)).toHaveTextContent('9'))
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    await waitFor(() => expect(cellOf('RP-200', 5)).toHaveTextContent('3'))
    expect(saved).toHaveBeenLastCalledWith([expect.objectContaining({ field: 'quantity', value: 3, previousValue: 9 })])
  })

  test('a change the app refuses is put back, with its reason', async () => {
    const onEdit = vi.fn().mockRejectedValue(new Error('That bin is locked for counting.'))
    const user = renderSheet({ onEdit })
    await user.click(cellOf('TN-100', 4))
    fireEvent.paste(document.activeElement!, { clipboardData: { getData: () => 'Z-99-9' } })
    expect(await screen.findByText('That bin is locked for counting.')).toBeInTheDocument()
    expect(cellOf('TN-100', 4)).toHaveTextContent('A-01-1')
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled()
  })

  test('rows, categories and column titles you pass drive the sheet and what a paste is checked against', async () => {
    const user = renderSheet({
      rows: [
        { id: 'r1', ref: 'AC-1001', name: 'Hydrochloric acid', category: 'Acids', location: 'Shelf A2', quantity: 3, threshold: 4, unitValue: 18.5 },
        { id: 'r2', ref: 'BU-2001', name: 'Tris-HCl', category: 'Buffers', location: 'Fridge 1', quantity: 20, threshold: 8, unitValue: 12.4 },
      ],
      categories: ['Acids', 'Buffers'],
      copy: { columns: { ...DEFAULT_COPY.columns, quantity: 'Bottles', location: 'Storage' }, low: 'Below minimum' },
    })
    expect(within(grid()).getByRole('columnheader', { name: /Bottles/ })).toBeInTheDocument()
    expect(within(grid()).getByRole('columnheader', { name: /Storage/ })).toBeInTheDocument()
    expect(cellOf('AC-1001', 5)).toHaveTextContent('Below minimum')
    await user.click(cellOf('AC-1001', 3))
    fireEvent.paste(document.activeElement!, { clipboardData: { getData: () => 'Solvents' } })
    expect(await screen.findByText(/left as they were/)).toBeInTheDocument()
    expect(cellOf('AC-1001', 3)).toHaveTextContent('Acids')
  })

  test('shows its error with Retry', async () => {
    const onRetry = vi.fn()
    const user = renderSheet({ rows: [], error: 'Could not load the stock', onRetry })
    expect(await screen.findByText('Could not load the stock')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /retry|try again/i }))
    expect(onRetry).toHaveBeenCalled()
  })
})
