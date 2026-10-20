import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { CoverageMatrix, type CoverageMatrixColumn, type CoverageMatrixRow } from './coverage-matrix'

const COLUMNS: CoverageMatrixColumn[] = [
  { id: 'id', label: 'Identity', tone: 'chart-3' },
  { id: 'net', label: 'Network' },
]
const ROWS: CoverageMatrixRow[] = [
  { id: 'access', label: 'Initial access', values: [4, 1] },
  { id: 'lateral', label: 'Lateral movement', values: [0, null] },
]
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const fill = (cell: HTMLElement) => (cell.querySelector('[data-slot=coverage-matrix-fill]') as HTMLElement | null)?.style.height

describe('CoverageMatrix', () => {
  test('is a named grid, a row per row headed by its name, every cell named with its column and value', () => {
    reduced(<CoverageMatrix rows={ROWS} columns={COLUMNS} label="Detection coverage" formatValue={(v) => `${v} rules`} noneLabel="No rules" />)
    const grid = screen.getByRole('grid', { name: 'Detection coverage' })
    expect(grid).toHaveAccessibleDescription('2 of 4 covered.')
    const rows = within(grid).getAllByRole('row')
    expect(within(rows[0]!).getByRole('rowheader')).toHaveTextContent('Initial access')
    expect(
      within(rows[1]!)
        .getAllByRole('gridcell')
        .map((c) => c.getAttribute('aria-label')),
    ).toEqual(['Identity: No rules', 'Network: No rules'])
    expect(within(rows[0]!).getAllByRole('gridcell')[0]).toHaveAccessibleName('Identity: 4 rules')
  })

  test('fills each covered cell by depth on one scale, and hatches the empty ones', () => {
    reduced(<CoverageMatrix rows={ROWS} columns={COLUMNS} />)
    const cells = screen.getAllByRole('gridcell')
    expect(fill(cells[0]!)).toBe('100%')
    expect(fill(cells[1]!)).toBe('25%')
    expect(cells[2]).toHaveAttribute('data-state', 'none')
    expect(cells[2]!.querySelector('[data-slot=hatch]')).not.toBeNull()
  })

  test('a click or Enter selects a row; the selected row is marked and its gaps turn to danger', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()
    reduced(<CoverageMatrix rows={ROWS} columns={COLUMNS} onValueChange={onValueChange} />)
    const rows = screen.getAllByRole('row')
    await user.click(screen.getByText('Lateral movement'))
    expect(onValueChange).toHaveBeenCalledWith('lateral')
    expect(rows[1]).toHaveAttribute('aria-selected', 'true')
    expect(rows[1]!.querySelector('[data-slot=hatch]')).toHaveAttribute('data-tone', 'danger')
    // The click left focus on the row's name; Up and Enter select the row above.
    expect(document.activeElement).toHaveTextContent('Lateral movement')
    await user.keyboard('{ArrowUp}{Enter}')
    expect(onValueChange).toHaveBeenLastCalledWith('access')
    expect(rows[0]).toHaveAttribute('aria-selected', 'true')
  })

  test('is one tab stop: arrows move between the row names and the cells', async () => {
    const user = userEvent.setup()
    reduced(<CoverageMatrix rows={ROWS} columns={COLUMNS} />)
    await user.tab()
    expect(document.activeElement).toHaveAccessibleName('Identity: 4')
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toHaveAccessibleName('Network: 1')
    await user.keyboard('{ArrowDown}')
    expect(document.activeElement).toHaveAccessibleName('Network: None')
    await user.keyboard('{Home}')
    expect(document.activeElement).toHaveTextContent('Lateral movement')
    await user.keyboard('{End}')
    expect(document.activeElement).toHaveAccessibleName('Network: None')
  })

  test('the key names the hatch and the fill in your words', () => {
    reduced(<CoverageMatrix rows={ROWS} columns={COLUMNS} noneLabel="No rules" depthLabel="Fill = rule depth" />)
    const legend = document.querySelector('[data-slot=coverage-matrix-legend]')!
    expect(legend).toHaveTextContent('No rules')
    expect(legend).toHaveTextContent('Fill = rule depth')
  })

  test('with nothing to show it says so, and the labels translate it', () => {
    render(
      <YoujProvider reducedMotion="always" labels={{ noData: 'Keine Daten' }}>
        <CoverageMatrix rows={[]} columns={COLUMNS} />
      </YoujProvider>,
    )
    expect(screen.getByText('Keine Daten')).toBeInTheDocument()
  })
})
