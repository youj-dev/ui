import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Portfolio } from './portfolio'
import { SERIES } from './portfolio/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const chart = () => screen.getByRole('slider', { name: 'Value over time' })
const rows = () => within(screen.getByRole('region', { name: 'Investments' })).getAllByRole('listitem')

describe('Portfolio card', () => {
  test('leads with the value, how it moved over the period and what it is made of', () => {
    reduced(<Portfolio />)
    expect(screen.getByRole('heading', { level: 2, name: 'Portfolio' })).toBeInTheDocument()
    expect(screen.getAllByText('$48,260.18').length).toBeGreaterThan(0)
    expect(screen.getByText('past year', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Investments' })).toBeInTheDocument()
    expect(rows()).toHaveLength(5)
    expect(rows()[0]).toHaveTextContent('Equities')
    expect(rows()[0]).toHaveTextContent('14 holdings')
    expect(rows()[0]).toHaveTextContent('$21,480.50')
  })

  test('direction is an arrow and a spoken word as well as a color', async () => {
    const user = userEvent.setup()
    reduced(<Portfolio />)
    expect(rows()[0]).toHaveTextContent('Up 16.8%')
    expect(rows()[0]!.querySelector('[data-direction="up"]')).toHaveTextContent('▲')
    await user.click(screen.getByRole('button', { name: '1M' }))
    expect(rows()[0]).toHaveTextContent('Down 2.1%')
    expect(rows()[0]!.querySelector('[data-direction="down"]')).toHaveTextContent('▼')
    expect(rows()[2]).toHaveTextContent('Up 0.6%')
    expect(screen.getAllByText('Down 1.2%').length).toBeGreaterThan(0)
  })

  test('the period switch is controlled or not and reports the choice', async () => {
    const user = userEvent.setup()
    const onPeriodChange = vi.fn()
    reduced(<Portfolio onPeriodChange={onPeriodChange} />)
    expect(screen.getByRole('button', { name: '1Y' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: '5Y' }))
    expect(onPeriodChange).toHaveBeenCalledWith('5Y')
    expect(screen.getByRole('button', { name: '5Y' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('past 5 years', { exact: false })).toBeInTheDocument()
  })

  test('the arrow keys move a focus point along the chart and say its value and date', async () => {
    const user = userEvent.setup()
    reduced(<Portfolio />)
    chart().focus()
    expect(chart()).toHaveAttribute('aria-valuenow', '59')
    expect(chart().getAttribute('aria-valuetext')).toMatch(/^Oct 9, 2026: \$48,260\.18$/)
    await user.keyboard('{ArrowLeft}')
    expect(chart()).toHaveAttribute('aria-valuenow', '58')
    await user.keyboard('{Home}')
    expect(chart()).toHaveAttribute('aria-valuenow', '0')
    expect(chart()).toHaveAttribute('aria-valuetext', expect.stringContaining('2025'))
    await user.keyboard('{PageUp}')
    expect(chart()).toHaveAttribute('aria-valuenow', '6')
    await user.keyboard('{End}')
    expect(chart()).toHaveAttribute('aria-valuenow', '59')
    expect(chart()).toHaveAccessibleDescription(/arrow keys/)
  })

  test('hovering the chart scrubs a readout and leaving clears it', () => {
    reduced(<Portfolio />)
    const slider = chart()
    slider.getBoundingClientRect = () => ({ left: 0, width: 590, top: 0, height: 160, right: 590, bottom: 160, x: 0, y: 0, toJSON: () => ({}) })
    expect(document.querySelector('[data-slot="portfolio-readout"]')).toBeNull()
    fireEvent.pointerMove(slider, { clientX: 295 })
    const readout = document.querySelector('[data-slot="portfolio-readout"]')
    expect(readout).not.toBeNull()
    expect(readout).toHaveTextContent(/\$\d/)
    fireEvent.pointerLeave(slider)
    expect(document.querySelector('[data-slot="portfolio-readout"]')).toBeNull()
  })

  test('copy rewrites the text, and the locale and currency format every amount', () => {
    reduced(
      <Portfolio
        locale="de-DE"
        format={{ style: 'currency', currency: 'EUR' }}
        periods={[
          { id: '1M', label: '1M', name: 'x' },
          { id: '1Y', label: '1Y', name: 'im Jahr', axis: { month: 'short', year: '2-digit' } },
          { id: '5Y', label: '5Y', name: 'x' },
        ]}
        series={{ ...SERIES }}
        copy={{ title: 'Retirement', investments: 'Positions' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Retirement' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Positions' })).toBeInTheDocument()
    expect(screen.getAllByText(/48\.260,18\s€/).length).toBeGreaterThan(0)
    expect(screen.getByText('im Jahr', { exact: false })).toBeInTheDocument()
  })

  test('periods, icons and format come from the data: custom spans, a compact unit and a part with its own glyph', async () => {
    const user = userEvent.setup()
    const onPeriodChange = vi.fn()
    reduced(
      <Portfolio
        format={{ style: 'currency', currency: 'USD', notation: 'compact', minimumFractionDigits: 0, maximumFractionDigits: 1 }}
        periods={[
          { id: 'w', label: '7D', name: 'past 7 days' },
          { id: 'm', label: '30D', name: 'past 30 days' },
        ]}
        series={{
          w: [{ t: Date.UTC(2026, 9, 3), v: 1_000_000 }, { t: Date.UTC(2026, 9, 9), v: 1_200_000 }],
          m: [{ t: Date.UTC(2026, 8, 9), v: 800_000 }, { t: Date.UTC(2026, 9, 9), v: 1_200_000 }],
        }}
        holdings={[{ id: 'core', name: 'Core plan', icon: <svg data-testid="core-icon" />, count: 2, value: 900_000, change: { w: 0.1, m: 0.3 } }]}
        defaultPeriod="w"
        copy={{ holdings: (n: number) => `${n} plans` }}
        onPeriodChange={onPeriodChange}
      />,
    )
    expect(screen.getByRole('button', { name: '7D' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByText('$1.2M').length).toBeGreaterThan(0)
    expect(screen.getByText('$200K past 7 days')).toBeInTheDocument()
    expect(rows()[0]).toHaveTextContent('2 plans')
    expect(rows()[0]).toHaveTextContent('Up 10.0%')
    expect(screen.getByTestId('core-icon')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '30D' }))
    expect(onPeriodChange).toHaveBeenCalledWith('m')
    expect(rows()[0]).toHaveTextContent('Up 30.0%')
    expect(screen.getByText('$400K past 30 days')).toBeInTheDocument()
  })

  test('loading takes the figures, chart and rows; an error offers Retry; no series shows the empty message', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const { rerender } = reduced(<Portfolio loading />)
    expect(screen.getByText('Loading the portfolio')).toBeInTheDocument()
    expect(screen.queryByRole('slider')).toBeNull()
    expect(screen.queryByText('$48,260.18')).toBeNull()
    expect(rows).toThrow()
    const again = (ui: React.ReactNode) => rerender(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
    again(<Portfolio series={{}} />)
    expect(screen.getByText('Nothing to show yet')).toBeInTheDocument()
    again(<Portfolio error="Couldn’t load the portfolio." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the portfolio.')).toBeInTheDocument()
    expect(screen.queryByText('$48,260.18')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
  })

  test('standalone it is a page under an h1 and its panel title is an h2', () => {
    reduced(<Portfolio embedded={false} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Portfolio' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Investments' })).toBeInTheDocument()
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
  })
})
