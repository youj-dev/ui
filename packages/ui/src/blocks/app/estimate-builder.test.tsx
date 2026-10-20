import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { EstimateBuilder } from './estimate-builder'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const figure = () => document.querySelector('[data-slot=stat-value]')!
const line = (name: string) => screen.getAllByRole('slider', { hidden: true }).find((el) => el.getAttribute('aria-label') === name)!
const key = () => within(screen.getByRole('list', { name: 'Cost by line' })).getAllByRole('listitem')

describe('EstimateBuilder', () => {
  test('leads with the monthly estimate of the Startup preset, split by line', () => {
    reduced(<EstimateBuilder />)
    expect(screen.getByRole('heading', { level: 2, name: 'Cost estimate' })).toBeInTheDocument()
    expect(figure()).toHaveTextContent('$515')
    expect(figure()).toHaveTextContent('/ month')
    expect(screen.getByText('≈ $0.29 per GB ingested, all-in')).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Cost by line' })).toHaveAttribute('aria-valuetext', 'Ingest 49%, Retention 14%, Queries 16%, Seats 21%')
    expect(key().map((li) => li.textContent)).toEqual(['Ingest$25249%', 'Retention$7214%', 'Queries$8316%', 'Seats$10821%'])
    expect(screen.getByText('Startup preset')).toBeInTheDocument()
  })

  test('each usage line is a named ruler with its amount spoken in its unit', () => {
    reduced(<EstimateBuilder />)
    const ingest = line('Ingest')
    expect(ingest).toHaveAttribute('aria-valuenow', '60')
    expect(ingest).toHaveAttribute('aria-valuetext', '60 GB / day')
    expect(document.querySelectorAll('[data-slot=slider][data-variant=ticks]')).toHaveLength(4)
  })

  test('moving a ruler reprices the estimate and makes it Custom; Reset goes back', async () => {
    const user = userEvent.setup()
    const onUsageChange = vi.fn()
    reduced(<EstimateBuilder onUsageChange={onUsageChange} />)
    line('Seats').focus()
    await user.keyboard('{ArrowRight}')
    expect(onUsageChange).toHaveBeenLastCalledWith({ ingest: 60, retention: 30, queries: 30, seats: 13 })
    expect(figure()).toHaveTextContent('$524')
    expect(screen.getByText('Custom')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(figure()).toHaveTextContent('$515')
    expect(screen.getByRole('button', { name: 'Reset' })).toBeDisabled()
  })

  test('a preset sets every line, and annual billing takes the discount', async () => {
    const user = userEvent.setup()
    const onBillingChange = vi.fn()
    reduced(<EstimateBuilder onBillingChange={onBillingChange} />)
    await user.click(screen.getByRole('button', { name: 'Hobby' }))
    expect(line('Ingest')).toHaveAttribute('aria-valuenow', '10')
    expect(figure()).toHaveTextContent('$97')
    await user.click(screen.getByRole('button', { name: /Annual/ }))
    expect(onBillingChange).toHaveBeenCalledWith('annual')
    // 96.80 a month, 12 months, 15% off.
    expect(figure()).toHaveTextContent('$987')
    expect(figure()).toHaveTextContent('/ year')
  })

  test('Save estimate sends the usage, region, billing and totals', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    reduced(<EstimateBuilder onSave={onSave} defaultRegion="eu-central" />)
    expect(screen.getByText('USD · Excl. tax · eu-central')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save estimate' }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ usage: { ingest: 60, retention: 30, queries: 30, seats: 12 }, region: 'eu-central', billing: 'monthly' }),
    )
    expect(onSave.mock.calls[0]![0].monthly).toBeCloseTo(514.5 * 1.08)
  })

  test('your lines, presets and words drive the content', () => {
    reduced(
      <EstimateBuilder
        lines={[
          { id: 'mails', label: 'Mails', tone: 'chart-2', unit: 'k / day', min: 0, max: 100, step: 1, price: 0.1, priceUnit: 'k', perMonth: 30 },
        ]}
        presets={[{ id: 'one', label: 'One', usage: { mails: 20 } }]}
        regions={[{ id: 'eu', label: 'EU', factor: 1 }]}
        copy={{ title: 'Mail estimate', currency: 'EUR' }}
        locale="en-GB"
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Mail estimate' })).toBeInTheDocument()
    expect(figure()).toHaveTextContent('€60')
    expect(screen.getByText('One preset')).toBeInTheDocument()
  })

  test('formats rewrite the amounts and the unit prices', () => {
    reduced(
      <EstimateBuilder
        formats={{
          amount: { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 },
          unitPrice: { maximumFractionDigits: 3 },
        }}
      />,
    )
    expect(figure()).toHaveTextContent('$514.50')
    expect(screen.getAllByText('0.14 / GB').length).toBeGreaterThan(0)
  })

  test('your lines in other words price a quote with its own billing words', () => {
    reduced(
      <EstimateBuilder
        lines={[
          { id: 'guests', label: 'Guests', tone: 'chart-1', unit: 'guests', min: 20, max: 400, step: 5, price: 38, priceUnit: 'guest' },
          { id: 'staff', label: 'Staff hours', tone: 'chart-3', unit: 'hours', min: 4, max: 60, step: 1, price: 32, priceUnit: 'hour' },
        ]}
        presets={[{ id: 'small', label: 'Brunch', usage: { guests: 30, staff: 6 } }]}
        regions={[{ id: 'dt', label: 'Downtown', factor: 1 }]}
        copy={{ title: 'Catering quote', monthly: 'Single event', annual: 'Twelve events', perMonth: '/ event', save: 'Save quote' }}
      />,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Catering quote' })).toBeInTheDocument()
    // 30 guests at $38 and 6 hours at $32.
    expect(figure()).toHaveTextContent('$1,332')
    expect(figure()).toHaveTextContent('/ event')
    expect(screen.getByRole('button', { name: 'Single event' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save quote' })).toBeInTheDocument()
    expect(screen.getAllByText('Staff hours').length).toBeGreaterThan(0)
  })

  test('with no lines it shows the empty message over the body and disables Save', () => {
    reduced(<EstimateBuilder lines={[]} />)
    expect(screen.getByText('Nothing to estimate')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save estimate' })).toBeDisabled()
  })

  test('your empty node replaces the default message', () => {
    reduced(<EstimateBuilder lines={[]} empty={<p>Add a line</p>} />)
    expect(screen.getByText('Add a line')).toBeInTheDocument()
    expect(screen.queryByText('Nothing to estimate')).not.toBeInTheDocument()
  })

  test('an error shows its message and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<EstimateBuilder error="Couldn’t load the prices." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the prices.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save estimate' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the body as skeletons and names the wait', () => {
    reduced(<EstimateBuilder loading />)
    expect(screen.getByText('Loading the estimate')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot=skeleton]').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Save estimate' })).toBeDisabled()
  })

  test('showBilling false hides the billing switch', () => {
    reduced(<EstimateBuilder showBilling={false} />)
    expect(screen.queryByRole('button', { name: 'Monthly' })).not.toBeInTheDocument()
    expect(figure()).toHaveTextContent('/ month')
  })

  test('standalone draws a page with the title as the h1', () => {
    reduced(<EstimateBuilder embedded={false} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Cost estimate' })).toBeInTheDocument()
  })
})
