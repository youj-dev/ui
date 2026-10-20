import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToString } from 'react-dom/server'
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table'

describe('Table', () => {
  describe('scroll container keyboard access', () => {
    let resize: () => void
    const observe = vi.fn()
    const disconnect = vi.fn()

    beforeEach(() => {
      vi.stubGlobal('ResizeObserver', class {
        constructor(callback: ResizeObserverCallback) {
          resize = () => callback([], this as unknown as ResizeObserver)
        }
        observe = observe
        disconnect = disconnect
      })
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(360)
    })

    afterEach(() => {
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
      vi.clearAllMocks()
    })

    test('makes an overflowing table a named region reachable by keyboard', async () => {
      vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(800)
      const user = userEvent.setup()
      render(<Table />)
      const region = screen.getByRole('region', { name: 'Table, scrolls sideways' })
      expect(region).toHaveAttribute('tabindex', '0')
      expect(region).toHaveClass('focus-ring')
      await user.tab()
      expect(region).toHaveFocus()
    })

    test('adds and removes the tab stop as overflow changes, and cleans up observation', () => {
      const width = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(360)
      const { unmount } = render(<Table />)
      const table = screen.getByRole('table')
      const frame = table.parentElement!
      expect(frame).not.toHaveAttribute('tabindex')
      expect(frame).not.toHaveAttribute('role')
      expect(frame).not.toHaveAttribute('aria-label')
      expect(observe).toHaveBeenCalledWith(frame)
      expect(observe).toHaveBeenCalledWith(table)

      width.mockReturnValue(361)
      act(() => resize())
      expect(frame).toHaveAttribute('tabindex', '0')
      expect(frame).toHaveAttribute('role', 'region')

      width.mockReturnValue(360)
      act(() => resize())
      expect(frame).not.toHaveAttribute('tabindex')
      expect(frame).not.toHaveAttribute('role')
      expect(frame).not.toHaveAttribute('aria-label')
      unmount()
      expect(disconnect).toHaveBeenCalledOnce()
    })

    test('does not add a tab stop or region during server rendering', () => {
      vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(800)
      const html = renderToString(<Table />)
      expect(html).not.toContain('tabindex')
      expect(html).not.toContain('role="region"')
      expect(observe).not.toHaveBeenCalled()
    })
  })

  test('renders a native table in a scroll container, with separated borders so rows can move', () => {
    render(
      <Table>
        <TableCaption>Invoices this month</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead className="text-end">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow data-state="selected">
            <TableCell>INV-001</TableCell>
            <TableCell className="text-end">$250.00</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell className="text-end">$250.00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    )
    const table = screen.getByRole('table', { name: 'Invoices this month' })
    expect(table.parentElement).toHaveAttribute('data-slot', 'table-container')
    expect(table).toHaveClass('border-separate', 'own:border-spacing-0')
    expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Invoice', 'Amount'])
    expect(within(table).getAllByRole('row')).toHaveLength(3)
    // Dividers live on the cells, where they move with their row.
    expect(within(table).getAllByRole('cell')[0]).toHaveClass('own:border-b')
  })
})
