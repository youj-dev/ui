import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ActivityHeatmap, type ActivityHeatmapDay } from './activity-heatmap'
import { DAYS } from './activity-heatmap/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const grid = (name = 'Orders per day') => screen.getByRole('grid', { name })
const cell = (row: number, col: number) => document.querySelector<HTMLElement>(`[data-yj-cell="${row}-${col}"]`)!
const tip = () => document.querySelector('[data-slot=activity-heatmap-tip]')
const readout = () => document.querySelector('[data-slot=activity-heatmap-readout]')!
/** A strip figure's spoken text and its detail line. */
const stat = (label: string) => {
  const box = within(document.querySelector('[data-slot=activity-heatmap-stats]') as HTMLElement).getByText(label).parentElement!
  return `${box.querySelector('[data-slot=counter] .sr-only')?.textContent} ${box.querySelector('dd > span:last-child')?.textContent}`
}
const number = new Intl.NumberFormat('en-US')

describe('ActivityHeatmap block', () => {
  test('a year of days, weekdays down and weeks across, from the Sunday 53 weeks back to today; every day named', () => {
    reduced(<ActivityHeatmap />)
    expect(screen.getByRole('heading', { level: 2, name: 'Order activity' })).toBeInTheDocument()
    expect(screen.getByText('Orders per day · Oct 5, 2025 – Oct 10, 2026')).toBeInTheDocument()
    // A head row, then a row per weekday, Sunday first in en-US.
    const rows = within(grid()).getAllByRole('row')
    expect(rows).toHaveLength(8)
    expect(within(grid()).getAllByRole('rowheader').map((th) => th.textContent)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
    // Black Friday is the busiest day; today is marked, and the one tab stop.
    const friday = DAYS.find((d) => d.date === '2025-11-28')!
    expect(screen.getByRole('gridcell', { name: `Friday, November 28, 2025: ${friday.value} orders` })).toHaveAttribute('data-yj-level', '4')
    const today = DAYS.at(-1)!
    expect(cell(6, 52)).toHaveAccessibleName(`Saturday, October 10, 2026: ${today.value} orders, today so far`)
    expect(cell(6, 52)).toHaveAttribute('data-yj-today')
    expect(grid().querySelectorAll('[tabindex="0"]')).toEqual(expect.objectContaining({ length: 1 }))
    expect(cell(6, 52)).toHaveAttribute('tabindex', '0')
    // The figures over it, and the grid's summary.
    const year = DAYS.filter((d) => d.date >= '2025-10-05')
    const total = year.reduce((t, d) => t + d.value, 0)
    expect(stat('Orders')).toBe(`${number.format(total)} on ${year.filter((d) => d.value > 0).length} days`)
    expect(stat('Busiest day')).toBe(`${friday.value} Fri, Nov 28, 2025`)
    expect(stat('Streak')).toBe('53 best 165 · 25+ a day')
    expect(grid()).toHaveAccessibleDescription(`${number.format(total)} orders over 53 weeks. Busiest day: Friday, November 28, 2025, ${friday.value} orders. Saturday is busiest.`)
  })

  test('the grid is one tab stop: arrows by day and week, Home and End along a weekday, Page by four weeks, Ctrl+Home and Ctrl+End to the ends; the tip follows', async () => {
    const user = userEvent.setup()
    reduced(<ActivityHeatmap />)
    await user.tab()
    while (!grid().contains(document.activeElement)) await user.tab()
    expect(cell(6, 52)).toHaveFocus()
    expect(tip()).toHaveTextContent(/^Sat, Oct 10, 2026\d+ orders · so far$/)
    await user.keyboard('{ArrowLeft}{ArrowUp}')
    expect(cell(5, 51)).toHaveFocus()
    expect(tip()).toHaveTextContent(/^Fri, Oct 2, 2026\d+ orders$/)
    await user.keyboard('{PageUp}')
    expect(cell(5, 47)).toHaveFocus()
    await user.keyboard('{Home}')
    expect(cell(5, 0)).toHaveFocus()
    // There's no day after today: the move doesn't happen.
    await user.keyboard('{Control>}{End}{/Control}{ArrowDown}')
    expect(cell(6, 52)).toHaveFocus()
    await user.keyboard('{Control>}{Home}{/Control}')
    expect(cell(0, 0)).toHaveFocus()
    expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1)
    await user.keyboard('{Escape}')
    expect(tip()).toHaveClass('opacity-0')
  })

  test('the legend is a set of toggles: a step lights only its days, says how many, and pressing it again shows them all', async () => {
    const user = userEvent.setup()
    reduced(<ActivityHeatmap />)
    const legend = screen.getByRole('group', { name: 'Show only' })
    const steps = within(legend).getAllByRole('button')
    expect(steps.map((s) => s.getAttribute('aria-label'))).toEqual(['Days with no orders', 'Days with 4–28 orders', 'Days with 29–33 orders', 'Days with 34–40 orders', 'Days with 41+ orders'])
    expect(readout()).toHaveTextContent('Each step holds a quarter of the active days')
    await user.click(steps[0]!)
    expect(steps[0]).toHaveAttribute('aria-pressed', 'true')
    // The week the shop was closed.
    expect(screen.getByText('Days with no orders: 7', { selector: '[role=status]' })).toBeInTheDocument()
    const closed = screen.getByRole('gridcell', { name: 'Wednesday, August 12, 2026: 0 orders' })
    expect(closed.firstElementChild).toHaveStyle({ opacity: '1' })
    expect(screen.getByRole('gridcell', { name: /^Friday, November 28, 2025/ }).firstElementChild).toHaveStyle({ opacity: '0.18' })
    await user.click(steps[0]!)
    expect(steps[0]).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Showing all', { selector: '[role=status]' })).toBeInTheDocument()
  })

  test('Hours shows each hour of the week, a day on average; the strip reads the busiest hour', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    reduced(<ActivityHeatmap onViewChange={onViewChange} />)
    await user.click(screen.getByRole('button', { name: 'Hours' }))
    expect(onViewChange).toHaveBeenCalledWith('hours')
    const hours = grid('Orders in each hour of the week')
    expect(within(hours).getAllByRole('row')[1]!.querySelectorAll('[role=gridcell]')).toHaveLength(24)
    // Intl sets the hours with thin and narrow spaces.
    expect(screen.getByRole('gridcell', { name: (name) => name.replace(/\s/g, ' ') === 'Saturday, 9 – 10 PM: 3.7 orders a day' })).toBeInTheDocument()
    expect(stat('Busiest hour').replace(/\s/g, ' ')).toBe('3.7 Sat · 9 – 10 PM')
    expect(within(screen.getByRole('group', { name: 'Show only' })).getAllByRole('button')[4]).toHaveAccessibleName(/^Hours with [\d.]+\+ orders a day$/)
    expect(screen.getByText(/^Orders in each hour, a day on average · /)).toBeInTheDocument()
  })

  describe('with your data', () => {
    const days: ActivityHeatmapDay[] = [
      { date: '2026-03-02', value: 1 },
      { date: '2026-03-03', value: 4 },
      { date: '2026-03-04', value: 0 },
      { date: '2026-03-05', value: 2 },
      { date: '2026-03-06', value: 3 },
    ]

    test('days, today, weeks, weekStart, copy and locale drive it; there are no hours to switch to; a day calls back when picked', async () => {
      const user = userEvent.setup()
      const onDaySelect = vi.fn()
      reduced(<ActivityHeatmap days={days} weeks={2} weekStart={1} locale="de-DE" copy={{ title: 'Commits' }} onDaySelect={onDaySelect} />)
      expect(screen.getByRole('heading', { level: 2, name: 'Commits' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Hours' })).toBeNull()
      expect(within(grid()).getAllByRole('rowheader')[0]).toHaveTextContent('Mo')
      // Today is the latest day given: Friday, the fifth of its week.
      expect(cell(4, 1)).toHaveAttribute('data-yj-today')
      expect(cell(5, 1)).toBeNull()
      // Without a goal the streak counts days with any activity: Thursday and Friday.
      expect(stat('Streak')).toMatch(/^2 best 2/)
      await user.click(screen.getByRole('gridcell', { name: /^Dienstag, 3\. März 2026: 4 orders$/ }))
      expect(onDaySelect).toHaveBeenCalledWith({ date: '2026-03-03', value: 4 })
      screen.getByRole('gridcell', { name: /^Freitag, 6\. März/ }).focus()
      await user.keyboard('{Enter}')
      expect(onDaySelect).toHaveBeenLastCalledWith({ date: '2026-03-06', value: 3 })
    })

    test('a goal sets the streak; steps fix the legend; a controlled view asks first', async () => {
      const user = userEvent.setup()
      const onViewChange = vi.fn()
      const view = reduced(<ActivityHeatmap days={days} goal={2} steps={[2, 3, 4]} />)
      expect(stat('Streak')).toMatch(/^2 best 2 · 2\+ a day/)
      expect(within(screen.getByRole('group', { name: 'Show only' })).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
        'Days with no orders',
        'Days with 1 orders',
        'Days with 2 orders',
        'Days with 3 orders',
        'Days with 4+ orders',
      ])
      expect(readout()).toHaveTextContent('')
      view.unmount()
      reduced(<ActivityHeatmap view="days" onViewChange={onViewChange} />)
      await user.click(screen.getByRole('button', { name: 'Hours' }))
      expect(onViewChange).toHaveBeenCalledWith('hours')
      expect(grid()).toBeInTheDocument()
    })
  })

  test('fewer weeks keep one tab stop, on the newest day', () => {
    const view = reduced(<ActivityHeatmap />)
    view.rerender(
      <YoujProvider reducedMotion="always">
        <ActivityHeatmap weeks={4} />
      </YoujProvider>,
    )
    expect(grid().querySelectorAll('[tabindex="0"]')).toHaveLength(1)
    expect(cell(6, 3)).toHaveAttribute('tabindex', '0')
  })

  test('another world drives it: a unit format and its words reach the figures, the cells and the legend', () => {
    const days: ActivityHeatmapDay[] = [
      { date: '2026-10-05', value: 10 },
      { date: '2026-10-06', value: 20 },
      { date: '2026-10-07', value: 30 },
      { date: '2026-10-08', value: 40 },
    ]
    reduced(
      <ActivityHeatmap
        days={days}
        today="2026-10-11"
        weeks={4}
        weekStart={1}
        goal={10}
        format={{ style: 'unit', unit: 'minute', unitDisplay: 'narrow', maximumFractionDigits: 0 }}
        copy={{
          title: 'Meditation',
          total: 'Total time',
          grid: { days: 'Minutes meditated per day', hours: '' },
          count: { days: (value: string) => value, hours: (value: string) => value },
        }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Meditation' })).toBeInTheDocument()
    expect(stat('Total time')).toContain('100m')
    expect(within(grid('Minutes meditated per day')).getByLabelText(/Tuesday, October 6, 2026: 20m/)).toBeInTheDocument()
  })

  test('loading, an error with Retry, and no activity each stand over the laid-out card, so it keeps its size', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const loading = reduced(<ActivityHeatmap loading />)
    expect(screen.getByText('Loading activity')).toBeInTheDocument()
    expect(document.querySelector('[data-slot=activity-heatmap-grid]')!.closest('[inert]')).toHaveClass('invisible')
    loading.unmount()
    const failed = reduced(<ActivityHeatmap error="It failed." onRetry={onRetry} />)
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
    failed.unmount()
    reduced(<ActivityHeatmap days={[]} />)
    expect(screen.getByText('No activity yet')).toBeInTheDocument()
    expect(screen.queryByRole('grid')).toBeNull()
  })

  test('reduced motion draws every cell at once; with motion they wait to be seen and sweep in oldest first', () => {
    const view = reduced(<ActivityHeatmap />)
    expect(cell(0, 0).firstElementChild).toHaveStyle({ opacity: '1' })
    expect((cell(0, 30).firstElementChild as HTMLElement).style.transitionDelay).toBe('')
    view.unmount()
    render(
      <YoujProvider reducedMotion="never">
        <ActivityHeatmap />
      </YoujProvider>,
    )
    act(() => undefined)
    expect(cell(0, 0).firstElementChild).toHaveStyle({ opacity: '0' })
  })

  test('embedded is a section named by its heading; standalone draws the page', () => {
    const view = reduced(<ActivityHeatmap headingLevel={3} className="custom-root" data-testid="card" />)
    expect(screen.getByTestId('card')).toHaveClass('custom-root')
    expect(screen.getByRole('region', { name: 'Order activity' })).toBeInTheDocument()
    view.unmount()
    reduced(<ActivityHeatmap embedded={false} />)
    expect(screen.getByRole('main', { name: 'Order activity' })).toBeInTheDocument()
  })
})
