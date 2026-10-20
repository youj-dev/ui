import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Retention, type RetentionCohort } from './retention'
import { DEMO, averages } from './retention/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const grid = () => screen.getByRole('grid', { name: 'Retention by cohort' })
const cell = (row: number, col: number) => grid().querySelector<HTMLElement>(`[data-yj-cell="${row}-${col}"]`)!
const readout = () => document.querySelector('[data-slot=retention-readout]')!

describe('Retention block', () => {
  test('a row per cohort under the average, each cell named; the period still running is marked and left out of the average', () => {
    reduced(<Retention />)
    expect(screen.getByRole('heading', { level: 2, name: 'Retention' })).toBeInTheDocument()
    const weeks = DEMO.week
    expect(within(grid()).getAllByRole('row')).toHaveLength(weeks.length + 2)
    const first = weeks[0]!
    expect(cell(0, 1)).toHaveAccessibleName(
      `Jul 13, Week 1: ${new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(first.active[1]! / first.size)}, ${first.active[1]!.toLocaleString('en-US')} of ${first.size.toLocaleString('en-US')} people`,
    )
    const last = first.active.length - 1
    expect(cell(0, last)).toHaveAttribute('data-yj-partial')
    expect(cell(0, last)).toHaveAccessibleName(/, in progress$/)
    // The newest cohort's week 1 is still running, so week 1's average leaves it out.
    const avg = averages(weeks, true)
    const done = weeks.slice(0, -1)
    expect(avg[1]).toBeCloseTo(done.reduce((t, c) => t + c.active[1]!, 0) / done.reduce((t, c) => t + c.size, 0))
    expect(screen.getByRole('figure', { name: 'Retention curve' })).toHaveAccessibleDescription(/^12 cohorts, [\d,]+ people\. Average retention: Week 1 [\d.]+%, Week 4 [\d.]+%, Week 8 [\d.]+%\.$/)
  })

  test('the grid is one tab stop; arrows walk the triangle, Home and End run along a row, Ctrl+End jumps to the corner', async () => {
    const user = userEvent.setup()
    reduced(<Retention />)
    await user.tab()
    while (!grid().contains(document.activeElement)) await user.tab()
    expect(cell(0, 0)).toHaveFocus()
    expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1)
    await user.keyboard('{ArrowRight}{ArrowRight}')
    expect(cell(0, 2)).toHaveFocus()
    expect(readout()).toHaveTextContent(/^Jul 13 · Week 2: [\d.]+% \([\d,]+ of [\d,]+\)[\d.]+ pts (above|below) average$/)
    // Off the picked row and column, cells step back.
    expect(cell(3, 4)).toHaveClass('opacity-45')
    expect(cell(3, 2)).not.toHaveClass('opacity-45')
    await user.keyboard('{End}')
    expect(cell(0, DEMO.week[0]!.active.length - 1)).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    // The row below is a period shorter: the cursor keeps to the triangle.
    expect(cell(1, DEMO.week[1]!.active.length - 1)).toHaveFocus()
    await user.keyboard('{Home}')
    expect(cell(1, 0)).toHaveFocus()
    await user.keyboard('{Control>}{End}{/Control}')
    expect(cell(11, 1)).toHaveFocus()
    expect(readout()).toHaveTextContent('in progress')
  })

  test('pointing at a cell reads it; leaving the grid lets go', async () => {
    const user = userEvent.setup()
    reduced(<Retention />)
    await user.hover(cell(5, 3))
    expect(cell(5, 3)).toHaveAttribute('data-active')
    expect(readout()).toHaveTextContent(/^Aug 17 · Week 3/)
    await user.unhover(grid())
    expect(readout()).toHaveTextContent('AverageEach cohort')
  })

  test('the switches: people instead of shares, and monthly cohorts; both ask first when controlled', async () => {
    const user = userEvent.setup()
    const onMeasureChange = vi.fn()
    const onGranularityChange = vi.fn()
    const view = reduced(<Retention onMeasureChange={onMeasureChange} onGranularityChange={onGranularityChange} />)
    await user.click(screen.getByRole('button', { name: 'People' }))
    expect(onMeasureChange).toHaveBeenCalledWith('people')
    expect(cell(0, 1)).toHaveTextContent(DEMO.week[0]!.active[1]!.toLocaleString('en-US'))
    await user.click(screen.getByRole('button', { name: 'Monthly' }))
    expect(onGranularityChange).toHaveBeenCalledWith('month')
    expect(within(grid()).getAllByRole('row')).toHaveLength(DEMO.month.length + 2)
    expect(within(grid()).getByRole('rowheader', { name: 'Apr 2026' })).toBeInTheDocument()
    view.unmount()
    reduced(<Retention measure="percent" onMeasureChange={onMeasureChange} />)
    await user.click(screen.getByRole('button', { name: 'People' }))
    expect(screen.getByRole('button', { name: 'Percent' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('loading, an error with Retry, and no cohorts', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const loading = reduced(<Retention loading />)
    expect(screen.getByText('Loading retention')).toBeInTheDocument()
    loading.unmount()
    const failed = reduced(<Retention error="It failed." onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
    failed.unmount()
    reduced(<Retention cohorts={[]} />)
    expect(screen.getByText('No cohorts yet')).toBeInTheDocument()
  })

  describe('with your data', () => {
    const cohorts: RetentionCohort[] = [
      { id: 'a', start: '2026-06-01', size: 1000, active: [1000, 400, 300] },
      { id: 'b', start: '2026-07-01', size: 2000, active: [2000, 1000] },
    ]

    test('cohorts, locale and copy drive the card; nothing is partial unless you say so', () => {
      reduced(<Retention cohorts={cohorts} defaultGranularity="month" granularities={['month']} locale="de-DE" copy={{ title: 'Bindung', average: 'Schnitt' }} />)
      expect(screen.getByRole('heading', { level: 2, name: 'Bindung' })).toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Cohort size' })).not.toBeInTheDocument()
      expect(grid().querySelectorAll('[data-yj-partial]')).toHaveLength(0)
      // Month 1: (400 + 1000) of (1000 + 2000) people.
      expect(within(grid()).getByRole('rowheader', { name: 'Schnitt' }).parentElement).toHaveTextContent(/46,7\s%/)
      expect(within(document.querySelector('[data-slot=retention-keys]')!).getByText('Month 1')).toBeInTheDocument()
    })

    test('embedded is a section named by its heading; standalone draws the page', () => {
      const view = reduced(<Retention headingLevel={3} className="custom-root" data-testid="card" />)
      expect(screen.getByTestId('card')).toHaveClass('custom-root')
      expect(screen.getByRole('region', { name: 'Retention' })).toBeInTheDocument()
      view.unmount()
      reduced(<Retention embedded={false} />)
      expect(screen.getByRole('main', { name: 'Retention' })).toBeInTheDocument()
    })
  })
})
