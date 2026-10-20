import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { PercentileTrend } from './percentile-trend'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)

describe('PercentileTrend block', () => {
  test('leads with the p99 and its change, then the percentiles, the sampled requests and each item', () => {
    reduced(<PercentileTrend />)
    expect(screen.getByRole('heading', { level: 2, name: 'Latency' })).toBeInTheDocument()
    expect(screen.getByText('+38 ms vs prev.')).toBeInTheDocument()
    const stats = document.querySelector('[data-slot=percentile-trend-stats]')
    expect(stats).toHaveTextContent('p5085 msp90155 msRequests1.18M')
    expect(screen.getByRole('figure', { name: 'Sampled requests' })).toHaveAccessibleDescription(
      '360 requests sampled: p50 85 ms, p90 155 ms, p99 436 ms. 97.5% within the 300 ms SLO.',
    )
    const routes = within(screen.getByRole('region', { name: 'Routes' })).getAllByRole('listitem')
    expect(routes).toHaveLength(4)
    expect(routes[0]).toHaveTextContent('POST/checkout4.1% over468 ms, over the objective')
    expect(routes[2]).toHaveAttribute('data-status', 'ok')
  })

  test('the range control swaps the window, and the new p99 is announced', async () => {
    const user = userEvent.setup()
    reduced(<PercentileTrend />)
    await user.click(screen.getByRole('button', { name: '7D' }))
    expect(screen.getByRole('figure', { name: 'Sampled requests' })).toHaveAccessibleDescription(
      '360 requests sampled: p50 96 ms, p90 188 ms, p99 613 ms. 97.2% within the 300 ms SLO.',
    )
    expect(screen.getByText('+64 ms vs prev.')).toBeInTheDocument()
    expect(await screen.findByText('last 7 days: p99 613 ms, 97.2% within the objective.')).toHaveAttribute('role', 'status')
  })

  test('a faster window shows its change as good news', async () => {
    const user = userEvent.setup()
    reduced(<PercentileTrend />)
    await user.click(screen.getByRole('button', { name: '1H' }))
    expect(screen.getByText(/23 ms vs prev\./).closest('[data-slot=badge]')).toHaveAttribute('data-variant', 'success')
  })

  test('embedded, it is a section named by an h2, without the page around it', () => {
    reduced(<PercentileTrend embedded />)
    expect(screen.getByRole('heading', { level: 2, name: 'Latency' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Latency' })).toBeInTheDocument()
    expect(screen.queryByRole('main')).not.toBeInTheDocument()
  })

  test('Set alert saves an alert for the window shown', async () => {
    const user = userEvent.setup()
    const onSetAlert = vi.fn()
    reduced(<PercentileTrend onSetAlert={onSetAlert} defaultRange="1h" />)
    await user.click(screen.getByRole('button', { name: 'Set alert' }))
    await waitFor(() => expect(onSetAlert).toHaveBeenCalledWith('1h'))
  })

  describe('with your data', () => {
    test('subtitle, copy and locale drive the card', () => {
      reduced(<PercentileTrend subtitle="search-api · eu-west-1" copy={{ title: 'Search latency' }} />)
      expect(screen.getByRole('heading', { level: 2, name: 'Search latency' })).toBeInTheDocument()
      expect(screen.getByText('search-api · eu-west-1')).toBeInTheDocument()
    })

    test('the range is controlled: a pick asks, the prop decides', async () => {
      const user = userEvent.setup()
      const onRangeChange = vi.fn()
      reduced(<PercentileTrend range="24h" onRangeChange={onRangeChange} />)
      await user.click(screen.getByRole('button', { name: '1H' }))
      expect(onRangeChange).toHaveBeenCalledWith('1h')
      expect(screen.getByRole('button', { name: '24H' })).toHaveAttribute('aria-pressed', 'true')
    })

    test('the menu and Open traces call your handlers with the window', async () => {
      const user = userEvent.setup()
      const onOpenTraces = vi.fn()
      const onExport = vi.fn()
      reduced(<PercentileTrend onOpenTraces={onOpenTraces} onExport={onExport} />)
      await user.click(screen.getByRole('button', { name: 'Open traces' }))
      expect(onOpenTraces).toHaveBeenCalledWith('24h')
      await user.click(screen.getByRole('button', { name: 'More actions' }))
      await user.click(await screen.findByRole('menuitem', { name: /Export samples/ }))
      expect(onExport).toHaveBeenCalledWith('24h')
    })

    test('className, rest props and headingLevel reach the root', () => {
      reduced(<PercentileTrend embedded headingLevel={3} className="custom-root" data-testid="card" />)
      expect(screen.getByTestId('card')).toHaveClass('custom-root')
      expect(screen.getByRole('heading', { level: 3, name: 'Latency' })).toBeInTheDocument()
    })
  })

  describe('as data', () => {
    const waits = {
      samples: [12, 18, 22, 25, 31, 35, 40, 44, 52, 70],
      previous: 60,
      count: 4200,
      updated: '9:10 AM',
      items: [
        { id: 'a', prefix: 'Z1', name: 'North side', value: 48, over: 0.1 },
        { id: 'b', name: 'Harbor', value: 70, over: 0.4 },
      ],
    }
    const minutes = (value: number) => `${Math.round(value)} min`

    test('ranges are data: your windows head the control and are announced by name', async () => {
      const user = userEvent.setup()
      reduced(
        <PercentileTrend
          ranges={[
            { id: 'am', label: 'AM', name: 'this morning' },
            { id: 'pm', label: 'PM', name: 'this afternoon' },
          ]}
          snapshots={{ am: waits, pm: { ...waits, previous: 40 } }}
          format={minutes}
          target={50}
        />,
      )
      expect(screen.queryByRole('button', { name: '24H' })).toBeNull()
      expect(screen.getByRole('button', { name: 'AM' })).toHaveAttribute('aria-pressed', 'true')
      await user.click(screen.getByRole('button', { name: 'PM' }))
      expect(await screen.findByText(/this afternoon: p99 .* min,/)).toHaveAttribute('role', 'status')
    })

    test('format writes the headline, the percentiles, the change and each item, and target sets the status', () => {
      reduced(<PercentileTrend ranges={[{ id: 'am', label: 'AM' }]} snapshots={{ am: waits }} format={minutes} target={50} />)
      expect(screen.getByText(/^\d+ min$/, { selector: 'p' })).toBeInTheDocument()
      expect(screen.getByText(/^[+−]\d+ min vs prev\.$/)).toBeInTheDocument()
      const items = within(screen.getByRole('region', { name: 'Routes' })).getAllByRole('listitem')
      expect(items[0]).toHaveTextContent('Z1North side10.0% over48 min')
      expect(items[0]).toHaveAttribute('data-status', 'ok')
      expect(items[1]).toHaveAttribute('data-status', 'slow')
    })

    test('copy rewrites the names of the parts', () => {
      reduced(<PercentileTrend copy={{ headline: 'p99 wait', items: 'Zones' }} />)
      expect(screen.getByText('p99 wait')).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Zones' })).toBeInTheDocument()
    })

    test('a window with no samples shows the empty state', () => {
      reduced(<PercentileTrend ranges={[{ id: 'am', label: 'AM' }]} snapshots={{ am: { ...waits, samples: [], items: [] } }} />)
      expect(screen.getByText('No samples yet')).toBeInTheDocument()
      expect(screen.queryByRole('figure')).toBeNull()
    })

    test('your empty node replaces the default message', () => {
      reduced(<PercentileTrend ranges={[{ id: 'am', label: 'AM' }]} snapshots={{ am: { ...waits, samples: [] } }} empty={<p>Nothing yet</p>} />)
      expect(screen.getByText('Nothing yet')).toBeInTheDocument()
      expect(screen.queryByText('No samples yet')).toBeNull()
    })

    test('an error shows its message and Retry calls onRetry', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      reduced(<PercentileTrend error="Couldn’t load the timings." onRetry={onRetry} />)
      expect(screen.getByText('Couldn’t load the timings.')).toBeInTheDocument()
      expect(screen.queryByRole('figure')).toBeNull()
      expect(screen.queryByText('Updated 14:32')).toBeNull()
      expect(screen.getByRole('button', { name: 'Set alert' })).toBeDisabled()
      await user.click(screen.getByRole('button', { name: 'Retry' }))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    test('loading holds the figures’ place and shows no demo numbers', () => {
      reduced(<PercentileTrend loading />)
      expect(screen.getByText('Loading the latency')).toBeInTheDocument()
      expect(screen.queryByRole('figure')).toBeNull()
      expect(screen.queryByText(/ms vs prev\./)).toBeNull()
    })
  })
})
