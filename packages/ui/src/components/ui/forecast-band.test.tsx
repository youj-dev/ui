import { render, screen, within } from '@testing-library/react'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { de } from '@youj/core/locales/de'
import { ForecastBand, type ForecastPoint } from './forecast-band'

/** Three days at $100 a day, then two forecast days at the same pace. */
const ACTUAL = [100, 200, 300]
const FORECAST: ForecastPoint[] = [
  { value: 400, low: 380, high: 420 },
  { value: 500, low: 450, high: 560 },
]
const USD = { style: 'currency', currency: 'USD' } as const
const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const band = (props: Partial<React.ComponentProps<typeof ForecastBand>> = {}) => (
  <ForecastBand actual={ACTUAL} forecast={FORECAST} budget={450} start="2026-09-01" format={USD} {...props} />
)
const root = (container: HTMLElement) => container.querySelector('[data-slot=forecast-band]')!

describe('ForecastBand', () => {
  test('is an image named by its label and described by a summary of spend, forecast, range and crossing', () => {
    reduced(band())
    const chart = screen.getByRole('img', { name: 'Spend forecast' })
    expect(chart).toHaveAccessibleDescription(
      '$300 spent of $450. Forecast $500 by the end of the period, likely between $450 and $560. Crosses budget Sep 5',
    )
    reduced(band({ label: 'Cloud spend, September' }))
    expect(screen.getByRole('img', { name: 'Cloud spend, September' })).toBeInTheDocument()
  })

  test('formatValue writes every amount in your own unit, over format', () => {
    reduced(band({ formatValue: (value) => `${value} tickets` }))
    expect(screen.getByRole('img', { name: 'Spend forecast' })).toHaveAccessibleDescription(
      '300 tickets spent of 450 tickets. Forecast 500 tickets by the end of the period, likely between 450 tickets and 560 tickets. Crosses budget Sep 5',
    )
    expect(screen.getAllByText('450 tickets').length).toBeGreaterThan(0)
  })

  test('a scenario adds its path, a legend entry and a sentence on where it ends', () => {
    const { container, rerender } = reduced(band({ scenario: { label: 'With new rates', values: [360, 420] } }))
    expect(container.querySelector('[data-slot=forecast-band-scenario-line]')).toBeInTheDocument()
    expect(screen.getByText('With new rates')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAccessibleDescription(
      '$300 spent of $450. Forecast $500 by the end of the period, likely between $450 and $560. Crosses budget Sep 5 With new rates: $420 by the end of the period. Stays within budget',
    )
    rerender(<YoujProvider reducedMotion="always">{band({ scenario: { values: [440, 480] } })}</YoujProvider>)
    expect(screen.getByText('Scenario')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAccessibleDescription(/Scenario: \$480 by the end of the period\. Crosses budget Sep 5$/)
  })

  test('marks the day the forecast crosses the budget, interpolated between days', () => {
    // 400 on day 4, 500 on day 5: a budget of 450 is reached halfway through day 5.
    const { container } = reduced(band())
    expect(root(container)).toHaveAttribute('data-state', 'over')
    expect(container.querySelector('[data-slot=forecast-band-crossing]')).toHaveAttribute('data-day', '5')
    expect(screen.getByText('Crosses budget Sep 5')).toBeInTheDocument()
  })

  test('counts a budget reached exactly at a day’s end as that day, and finds a crossing already in the past', () => {
    const { container, rerender } = reduced(band({ budget: 400 }))
    expect(container.querySelector('[data-slot=forecast-band-crossing]')).toHaveAttribute('data-day', '4')
    rerender(<YoujProvider reducedMotion="always">{band({ budget: 150 })}</YoujProvider>)
    expect(container.querySelector('[data-slot=forecast-band-crossing]')).toHaveAttribute('data-day', '2')
    expect(screen.getByText('Crosses budget Sep 2')).toBeInTheDocument()
  })

  test('within budget: no marker, and the summary says it stays under', () => {
    const { container } = reduced(band({ budget: 600 }))
    expect(root(container)).toHaveAttribute('data-state', 'within')
    expect(container.querySelector('[data-slot=forecast-band-marker]')).toBeNull()
    expect(screen.queryByText(/Crosses budget/)).toBeNull()
    expect(screen.getByRole('img')).toHaveAccessibleDescription(/Stays within budget$/)
  })

  test('without a start date, names the crossing from today', () => {
    reduced(band({ start: undefined }))
    expect(screen.getByText('Crosses budget in 2 days')).toBeInTheDocument()
  })

  test('keeps the legend as text, and can leave it out', () => {
    const { rerender } = reduced(band())
    const legend = document.querySelector('[data-slot=forecast-band-legend]') as HTMLElement
    expect(within(legend).getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Actual', 'Forecast', 'Likely range', 'Budget'])
    rerender(<YoujProvider reducedMotion="always">{band({ legend: false })}</YoujProvider>)
    expect(document.querySelector('[data-slot=forecast-band-legend]')).toBeNull()
  })

  test('speaks the provider’s language', () => {
    render(
      <YoujProvider reducedMotion="always" locale="de-DE" labels={de}>
        {band()}
      </YoujProvider>,
    )
    expect(screen.getByRole('img', { name: 'Ausgabenprognose' })).toHaveAccessibleDescription(/Überschreitet das Budget am 5\. Sept\.$/)
    expect(screen.getByText('Ist')).toBeInTheDocument()
  })

  test('reduced motion draws everything in place, with no pulse', () => {
    const { container } = reduced(band())
    expect(root(container)).toHaveAttribute('data-reduced-motion')
    expect(container.querySelector('[data-slot=forecast-band-marker]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot=forecast-band-pulse]')).toBeNull()
  })

  test('with motion, the marker waits for the chart to scroll into view', () => {
    const { container } = render(<YoujProvider reducedMotion="never">{band()}</YoujProvider>)
    expect(root(container)).not.toHaveAttribute('data-reduced-motion')
    // Nothing scrolls into view in jsdom, so the reveal hasn't started.
    expect(container.querySelector('[data-slot=forecast-band-marker]')).toBeNull()
  })

  test('stops measuring its axis when unmounted', () => {
    const disconnect = vi.spyOn(ResizeObserver.prototype, 'disconnect')
    const { unmount } = reduced(band())
    unmount()
    expect(disconnect).toHaveBeenCalled()
    disconnect.mockRestore()
  })
})
