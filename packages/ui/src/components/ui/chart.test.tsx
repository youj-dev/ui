import type { ReactNode } from 'react'
import { render, renderHook, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider, type YoujProviderProps } from '@youj/core/lib/youj/provider'
import { ChartContainer, ChartDataTable, ChartLegendContent, ChartTooltipContent, chartColor, useChartMotion, type ChartConfig } from './chart'

const config = {
  revenue: { label: 'Revenue', color: 'var(--color-chart-1)' },
  expenses: { label: 'Expenses', color: 'var(--color-chart-4)' },
} satisfies ChartConfig

const data = [
  { month: 'Jan', revenue: 1200, expenses: 800 },
  { month: 'Feb', revenue: 1500, expenses: 900 },
]

const provider = (props: Omit<YoujProviderProps, 'children'>) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <YoujProvider {...props}>{children}</YoujProvider>
  }

describe('ChartContainer', () => {
  test('is a named figure described by its summary', () => {
    render(
      <ChartContainer config={config} title="Revenue by month" summary="Revenue grew 25%.">
        <div />
      </ChartContainer>,
    )
    const figure = screen.getByRole('figure', { name: 'Revenue by month' })
    expect(figure).toHaveAccessibleDescription('Revenue grew 25%.')
  })

  test('exposes each series colour as --color-<key>', () => {
    render(
      <ChartContainer config={config}>
        <div />
      </ChartContainer>,
    )
    const figure = document.querySelector<HTMLElement>('[data-slot=chart]')!
    expect(figure.style.getPropertyValue('--color-revenue')).toBe('var(--color-chart-1)')
    expect(figure.style.getPropertyValue('--color-expenses')).toBe('var(--color-chart-4)')
  })

  test('writes a key that is not a CSS name with - in it, where chartColor reads it, and says so once in development', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const air = { 'PM2.5': { label: 'PM2.5', color: 'var(--color-chart-1)' }, 'Net revenue/day': { color: 'var(--color-chart-2)' }, ozone: { color: 'var(--color-chart-3)' } } satisfies ChartConfig
    const { rerender } = render(
      <ChartContainer config={air}>
        <div />
      </ChartContainer>,
    )
    const figure = document.querySelector<HTMLElement>('[data-slot=chart]')!
    expect(figure.style.getPropertyValue('--color-PM2-5')).toBe('var(--color-chart-1)')
    expect(figure.style.getPropertyValue('--color-Net-revenue-day')).toBe('var(--color-chart-2)')
    expect(figure.style.getPropertyValue('--color-ozone')).toBe('var(--color-chart-3)')
    expect(chartColor('PM2.5')).toBe('var(--color-PM2-5)')
    expect(chartColor('Net revenue/day')).toBe('var(--color-Net-revenue-day)')
    expect(chartColor('ozone')).toBe('var(--color-ozone)')
    expect(chartColor('Kühlschrank')).toBe('var(--color-Kühlschrank)')
    rerender(
      <ChartContainer config={air}>
        <div />
      </ChartContainer>,
    )
    expect(warn.mock.calls.map(([message]) => String(message)).filter((message) => message.startsWith('[youj]'))).toEqual([
      '[youj] ChartConfig key "PM2.5" isn\'t a CSS name, so its color is --color-PM2-5. Color its series with chartColor("PM2.5").',
      '[youj] ChartConfig key "Net revenue/day" isn\'t a CSS name, so its color is --color-Net-revenue-day. Color its series with chartColor("Net revenue/day").',
    ])
    warn.mockRestore()
  })
})

describe('useChartMotion', () => {
  test('times Recharts with youj tokens and staggers later series', () => {
    const { result } = renderHook(() => useChartMotion(), { wrapper: provider({ reducedMotion: 'never' }) })
    expect(result.current.draw(0)).toEqual({
      isAnimationActive: true,
      animationBegin: 0,
      animationDuration: 560,
      animationEasing: 'cubic-bezier(0.16,1,0.3,1)',
    })
    expect(result.current.grow(0).animationDuration).toBe(340)
    expect(result.current.draw(2).animationBegin).toBe(144)
    expect(result.current.tooltip.animationDuration).toBe(140)
  })

  test('follows Speed', () => {
    const { result } = renderHook(() => useChartMotion(), { wrapper: provider({ reducedMotion: 'never', timeScale: 2 }) })
    expect(result.current.sweep(1)).toMatchObject({ animationDuration: 1120, animationBegin: 144 })
  })

  test('reduced motion turns every animation off', () => {
    const { result } = renderHook(() => useChartMotion(), { wrapper: provider({ reducedMotion: 'always' }) })
    expect(result.current.draw().isAnimationActive).toBe(false)
    expect(result.current.grow().isAnimationActive).toBe(false)
    expect(result.current.tooltip.isAnimationActive).toBe(false)
    expect(result.current.reduced).toBe(true)
  })

  test('returns the same object while the settings hold, so Recharts never restarts', () => {
    const { result, rerender } = renderHook(() => useChartMotion(), { wrapper: provider({ reducedMotion: 'never' }) })
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
  })
})

describe('ChartTooltipContent and ChartLegendContent', () => {
  // jsdom has no layout: give the responsive container a size so it renders its children.
  let rect: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 400, height: 200, top: 0, left: 0, right: 400, bottom: 200, x: 0, y: 0, toJSON: () => ({}) })
  })
  afterEach(() => rect.mockRestore())

  test('the tooltip heads with the label and lists each series by its config label', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent
          active
          label="Feb"
          payload={[
            { dataKey: 'revenue', name: 'revenue', value: 1500, color: 'var(--color-revenue)', graphicalItemId: 'a' },
            { dataKey: 'expenses', name: 'expenses', value: 900, color: 'var(--color-expenses)', graphicalItemId: 'b' },
          ]}
          valueFormatter={(value) => `$${value}`}
        />
      </ChartContainer>,
    )
    const tooltip = document.querySelector<HTMLElement>('[data-slot=chart-tooltip]')!
    expect(within(tooltip).getByText('Feb')).toBeInTheDocument()
    expect(within(tooltip).getByText('Revenue')).toBeInTheDocument()
    expect(within(tooltip).getByText('$1500')).toBeInTheDocument()
    expect(within(tooltip).getByText('$900')).toBeInTheDocument()
  })

  test('the tooltip renders nothing while inactive', () => {
    render(
      <ChartContainer config={config}>
        <ChartTooltipContent active={false} payload={[]} />
      </ChartContainer>,
    )
    expect(document.querySelector('[data-slot=chart-tooltip]')).toBeNull()
  })

  test('the legend is a list of config labels in the given order', () => {
    render(
      <ChartContainer config={config}>
        <ChartLegendContent
          payload={[
            { value: 'revenue', dataKey: 'revenue', color: 'red', type: 'rect' },
            { value: 'expenses', dataKey: 'expenses', color: 'blue', type: 'rect' },
          ]}
        />
      </ChartContainer>,
    )
    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual(['Revenue', 'Expenses'])
  })

  test('a key that is not a CSS name keeps its label and its color in the tooltip and the legend', () => {
    const air = { 'PM2.5': { label: 'Fine particles', color: 'var(--color-chart-1)' } } satisfies ChartConfig
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <ChartContainer config={air}>
        <ChartTooltipContent active label="Jan" payload={[{ dataKey: 'PM2.5', name: 'PM2.5', value: 12, color: chartColor('PM2.5'), graphicalItemId: 'a' }]} />
        <ChartLegendContent payload={[{ value: 'PM2.5', dataKey: 'PM2.5', color: chartColor('PM2.5'), type: 'rect' }]} />
      </ChartContainer>,
    )
    const tooltip = document.querySelector<HTMLElement>('[data-slot=chart-tooltip]')!
    expect(within(tooltip).getByText('Fine particles')).toBeInTheDocument()
    expect(tooltip.querySelector<HTMLElement>('[aria-hidden]')!.style.getPropertyValue('--swatch')).toBe('var(--color-PM2-5)')
    const legend = document.querySelector<HTMLElement>('[data-slot=chart-legend]')!
    expect(legend.textContent).toBe('Fine particles')
    expect(legend.querySelector<HTMLElement>('[aria-hidden]')!.style.backgroundColor).toBe('var(--color-PM2-5)')
    warn.mockRestore()
  })
})

describe('ChartDataTable', () => {
  test('hidden: a captioned table with row and column headers, visually hidden', () => {
    render(<ChartDataTable data={data} config={config} labelKey="month" labelHeading="Month" caption="Revenue by month" />)
    const table = screen.getByRole('table', { name: 'Revenue by month' })
    expect(table.closest('[data-slot=chart-data]')).toHaveClass('sr-only')
    expect(within(table).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['Month', 'Revenue', 'Expenses'])
    expect(within(table).getByRole('rowheader', { name: 'Feb' })).toBeInTheDocument()
    expect(within(table).getByText('1,500')).toBeInTheDocument()
    // No scroll container a keyboard can't reach (axe scrollable-region-focusable).
    expect(table.parentElement).toHaveAttribute('data-slot', 'chart-data')
  })

  test('toggle: "View data" reveals the table and reports its state', async () => {
    const user = userEvent.setup()
    render(
      <YoujProvider reducedMotion="always">
        <ChartDataTable mode="toggle" data={data} config={config} labelKey="month" caption="Revenue by month" valueFormatter={(v) => `$${v}`} />
      </YoujProvider>,
    )
    const toggle = screen.getByRole('button', { name: 'View data' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('table')).toBeNull()
    await user.click(toggle)
    expect(screen.getByRole('button', { name: 'Hide data' })).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByRole('table', { name: 'Revenue by month' })).toBeInTheDocument()
    expect(screen.getByText('$1500')).toBeInTheDocument()
    // Wide data scrolls in a region the keyboard can focus, named by the caption.
    const region = screen.getByRole('region', { name: 'Revenue by month' })
    expect(region).toHaveAttribute('tabindex', '0')
    expect(region).toContainElement(screen.getByRole('table'))
  })

  test('keys picks and orders the columns', () => {
    render(<ChartDataTable data={data} config={config} keys={['expenses']} labelKey="month" caption="Expenses" />)
    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['month', 'Expenses'])
  })
})
