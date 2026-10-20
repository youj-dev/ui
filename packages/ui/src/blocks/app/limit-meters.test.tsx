import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { LimitMeters } from './limit-meters'
import { LIMITERS } from './limit-meters/data'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const refused = () => Number(screen.getByText('429s').closest('div')!.querySelector('.font-mono')!.textContent)

describe('Limit meters block', () => {
  test('shows the chosen limiter’s bucket, burst, traffic and 429s', () => {
    reduced(<LimitMeters />)
    expect(screen.getByRole('heading', { level: 2, name: 'Rate limits' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Limiter' })).toHaveTextContent('checkout-svc')
    const bucket = screen.getByRole('meter', { name: 'Tokens' })
    expect(bucket).toHaveAttribute('aria-valuemax', '60')
    expect(bucket.getAttribute('aria-valuetext')).toMatch(/^\d+ of 60 tokens, refilling 10 a second/)
    expect(within(bucket).getByText('20')).toBeInTheDocument()
    expect(screen.getByText('req/min')).toBeInTheDocument()
    expect(refused()).toBe(8)
    expect(screen.getByRole('img', { name: /8 requests refused with 429 in the last hour/ })).toBeInTheDocument()
    expect(screen.getByText('Token bucket · 600/min · burst 20')).toBeInTheDocument()
  })

  test('a burst larger than the bucket drains it and is partly refused', async () => {
    const user = userEvent.setup()
    reduced(<LimitMeters />)
    await user.click(screen.getByRole('button', { name: 'Send a burst' }))
    expect(refused()).toBeGreaterThan(8)
    expect(screen.getByText('Throttling')).toBeInTheDocument()
    // The bucket refills in real time, so under load it may already read low again.
    expect(['empty', 'low']).toContain(screen.getByRole('meter', { name: 'Tokens' }).getAttribute('data-state'))
  })

  test('switches to an endpoint’s limiter', async () => {
    const user = userEvent.setup()
    reduced(<LimitMeters />)
    await user.click(screen.getByRole('combobox', { name: 'Limiter' }))
    await user.click(await screen.findByRole('option', { name: /POST \/v1\/embeddings/ }))
    expect(screen.getByRole('combobox', { name: 'Limiter' })).toHaveTextContent('POST /v1/embeddings')
    expect(screen.getByRole('meter', { name: 'Tokens' })).toHaveAttribute('aria-valuemax', '20')
    expect(screen.getByText('Token bucket · 120/min · burst 8')).toBeInTheDocument()
  })

  test('Raise limit widens the limit, the bucket and the burst, and says so', async () => {
    const user = userEvent.setup()
    reduced(<LimitMeters onRaiseLimit={() => undefined} />)
    await user.click(screen.getByRole('button', { name: 'Raise limit' }))
    await waitFor(() => expect(screen.getByText('Token bucket · 900/min · burst 30')).toBeInTheDocument())
    expect(screen.getByRole('meter', { name: 'Tokens' })).toHaveAttribute('aria-valuemax', '90')
    expect(screen.getAllByRole('status').some((s) => s.textContent === 'Limit raised to 900 a minute')).toBe(true)
  })

  test('embedded, it is a section named by an h2', () => {
    reduced(<LimitMeters embedded />)
    expect(screen.getByRole('region', { name: 'Rate limits' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Rate limits' })).toBeInTheDocument()
    expect(screen.queryByRole('main')).toBeNull()
  })

  test('runs demo traffic only without your limiters, and marks it', () => {
    vi.useFakeTimers()
    try {
      const { unmount } = reduced(<LimitMeters />)
      expect(screen.getByText('Demo data')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Send a burst' })).toBeInTheDocument()
      unmount()
      const mine = [{ ...LIMITERS[0]!, volume: 1234, tokens: 12 }]
      reduced(<LimitMeters limiters={mine} />)
      expect(screen.queryByText('Demo data')).toBeNull()
      expect(screen.queryByRole('button', { name: 'Send a burst' })).toBeNull()
      act(() => vi.advanceTimersByTime(5000))
      // Your figures, as given: no drift.
      expect(screen.getByText('1,234')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  test('demoMarker={false} hides the marker', () => {
    reduced(<LimitMeters demoMarker={false} />)
    expect(screen.queryByText('Demo data')).toBeNull()
  })

  test('kinds are data: your groups head the picker and own their limiters', async () => {
    const user = userEvent.setup()
    reduced(
      <LimitMeters
        kinds={[
          { id: 'phone', label: 'Phones' },
          { id: 'tablet', label: 'Tablets' },
        ]}
        limiters={[
          { ...LIMITERS[0]!, id: 'a', kind: 'phone', name: 'Dana' },
          { ...LIMITERS[1]!, id: 'b', kind: 'tablet', name: 'Ellie' },
        ]}
      />,
    )
    await user.click(screen.getByRole('combobox', { name: 'Limiter' }))
    expect(await screen.findByText('Phones')).toBeInTheDocument()
    expect(screen.getByText('Tablets')).toBeInTheDocument()
    expect(screen.queryByText('API keys')).toBeNull()
    expect(await screen.findByRole('option', { name: /Ellie/ })).toBeInTheDocument()
  })

  test('format.rate writes the throughput, the limit and the policy line', () => {
    reduced(<LimitMeters limiters={[{ ...LIMITERS[0]!, volume: 9.4 }]} format={{ rate: (value) => `<${value}>` }} />)
    expect(screen.getByText('<9.4>')).toBeInTheDocument()
    expect(screen.getByText('<600>')).toBeInTheDocument()
    expect(screen.getByText('Token bucket · <600>/min · burst 20')).toBeInTheDocument()
  })

  test('copy rewrites the labels and the status', () => {
    reduced(
      <LimitMeters limiters={[LIMITERS[0]!]} copy={{ tokens: 'Data left', throughput: 'Used', status: { ok: 'Fine', low: 'Low', empty: 'Out' } }} />,
    )
    expect(screen.getByRole('meter', { name: 'Data left' })).toBeInTheDocument()
    expect(screen.getByText('Used')).toBeInTheDocument()
    expect(screen.getByText('Fine')).toBeInTheDocument()
  })

  test('with no limiters it shows the empty state', () => {
    reduced(<LimitMeters limiters={[]} />)
    expect(screen.getByText('No limits yet')).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Limiter' })).toBeNull()
  })

  test('your empty node replaces the default message', () => {
    reduced(<LimitMeters limiters={[]} empty={<p>Add a key</p>} />)
    expect(screen.getByText('Add a key')).toBeInTheDocument()
    expect(screen.queryByText('No limits yet')).toBeNull()
  })

  test('an error shows its message and Retry calls onRetry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    reduced(<LimitMeters error="Couldn’t load the limits." onRetry={onRetry} />)
    expect(screen.getByText('Couldn’t load the limits.')).toBeInTheDocument()
    expect(screen.queryByRole('meter')).toBeNull()
    expect(screen.queryByText('Within limit')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  test('loading holds the figures’ place and shows no demo numbers', () => {
    reduced(<LimitMeters loading />)
    expect(screen.getByText('Loading the limits')).toBeInTheDocument()
    expect(screen.queryByRole('meter')).toBeNull()
    expect(screen.queryByText('Token bucket · 600/min · burst 20')).toBeNull()
    expect(screen.queryByText('Demo data')).toBeNull()
  })
})
