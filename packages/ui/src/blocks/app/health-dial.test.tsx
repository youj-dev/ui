import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { HealthDial } from './health-dial'

const reduced = (ui: React.ReactNode) => render(<YoujProvider reducedMotion="always">{ui}</YoujProvider>)
const regions = () => within(screen.getByRole('region', { name: 'Regions' })).getAllByRole('listitem')

describe('Health dial block', () => {
  test('shows the index, the three signals and each region’s latency', () => {
    reduced(<HealthDial onClose={() => {}} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Service health' })).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: 'Health index' })).toHaveAttribute('aria-valuetext', '74, Strained')
    expect(screen.getByRole('meter', { name: 'Error budget used' })).toHaveAttribute('aria-valuetext', '79%, High')
    expect(screen.getByRole('meter', { name: 'Open connections' })).toHaveAttribute('aria-valuetext', '1,310')
    expect(regions()[1]).toHaveTextContent('us-east-2')
    expect(regions()[1]).toHaveTextContent('p99 930 ms')
    expect(regions()[1]).toHaveTextContent('lagging')
    expect(screen.getByText('9 replicas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  test('the window control swaps the snapshot', async () => {
    const user = userEvent.setup()
    reduced(<HealthDial />)
    await user.click(screen.getByRole('button', { name: '15M' }))
    expect(screen.getByRole('meter', { name: 'Health index' })).toHaveAttribute('aria-valuetext', '86, Nominal')
    expect(screen.getByRole('meter', { name: 'Saturation' })).toHaveAttribute('aria-valuenow', '54')
    expect(regions()[1]).toHaveTextContent('p99 610 ms')
  })

  test('Shift traffic isolates the lagging part, and Add replica adds one', async () => {
    const user = userEvent.setup()
    reduced(<HealthDial />)
    await user.click(screen.getByRole('button', { name: 'Shift traffic from us-east-2' }))
    await waitFor(() => expect(regions()[1]).toHaveAttribute('data-status', 'isolated'))
    expect(regions()[1]).toHaveTextContent('isolated')
    // The action hides but keeps its column, so the rows don't shift.
    expect(screen.getByRole('button', { name: 'Shift traffic from us-east-2' })).toHaveClass('invisible')
    expect(screen.getByRole('button', { name: 'Shift traffic from us-east-2' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Add replica' }))
    await waitFor(() => expect(screen.getByText('10 replicas')).toBeInTheDocument())
  })

  test('embedded, it is a panel under an h2 with its sections one level down', () => {
    reduced(<HealthDial embedded />)
    expect(screen.getByRole('heading', { level: 2, name: 'Service health' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Regions' })).toBeInTheDocument()
    expect(screen.queryByRole('main')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
  })

  test('it takes the page’s layout density, embedded or on its own page, and the app can set its own', () => {
    const { unmount } = reduced(<HealthDial embedded={false} />)
    expect(screen.getByRole('main')).not.toHaveAttribute('data-yj-density')
    unmount()
    const embedded = reduced(<HealthDial />)
    expect(screen.getByRole('article', { name: 'Service health' })).not.toHaveAttribute('data-yj-density')
    embedded.unmount()
    reduced(<HealthDial embedded data-yj-density="roomy" />)
    expect(screen.getByRole('article', { name: 'Service health' })).toHaveAttribute('data-yj-density', 'roomy')
  })

  test('the last check ticks up, and an action resets it', async () => {
    vi.useFakeTimers()
    try {
      reduced(<HealthDial checkedAgo={4} />)
      expect(screen.getByText(/Checked/)).toHaveTextContent('Checked 4s ago')
      await vi.advanceTimersByTimeAsync(3000)
      expect(screen.getByText(/Checked/)).toHaveTextContent(/Checked [67]s ago/)
    } finally {
      vi.useRealTimers()
    }
  })

  describe('driven by your data', () => {
    const snapshots = {
      am: { index: 55, signals: [{ id: 'hr', label: 'Heart rate', value: 118, max: 200, format: {}, thresholds: [{ value: 110, tone: 'warning' as const, label: 'Elevated' }] }], parts: [{ id: 'b', label: 'Bedside', measures: [60, 2] as [number, number], status: 'drift' }] },
      pm: { index: 90, signals: [{ id: 'hr', label: 'Heart rate', value: 70, max: 200, format: {} }], parts: [{ id: 'b', label: 'Bedside', measures: [60, 2] as [number, number], status: 'ok' }] },
    }
    const ranges = [
      { id: 'am', label: 'Morning' },
      { id: 'pm', label: 'Evening' },
    ]
    const statuses = [
      { id: 'ok', label: 'steady', tone: 'success' as const },
      { id: 'drift', label: 'drifting', tone: 'warning' as const, action: true, then: 'done' },
      { id: 'done', label: 'rechecked', tone: 'muted' as const },
    ]

    test('ranges, signals, statuses and format drive the controls, the meters and the rows', async () => {
      const user = userEvent.setup()
      reduced(
        <HealthDial
          ranges={ranges}
          snapshots={snapshots}
          statuses={statuses}
          format={{ measures: [(n) => `${n} reads`, (n) => `every ${n}s`] }}
          copy={{ rebalance: 'Recheck', rebalanceFrom: (p) => `Recheck ${p}` }}
        />,
      )
      // Neither '6h' nor anything else is among the ranges, so the first is shown.
      expect(screen.getByRole('meter', { name: 'Heart rate' })).toHaveAttribute('aria-valuetext', '118, Elevated')
      expect(regions()[0]).toHaveTextContent('60 reads')
      expect(regions()[0]).toHaveTextContent('every 2s')
      expect(regions()[0]).toHaveTextContent('drifting')
      await user.click(screen.getByRole('button', { name: 'Recheck Bedside' }))
      await waitFor(() => expect(regions()[0]).toHaveTextContent('rechecked'))
      expect(screen.getByRole('button', { name: 'Recheck Bedside' })).toBeDisabled()
      await user.click(screen.getByRole('button', { name: 'Evening' }))
      expect(screen.getByRole('meter', { name: 'Heart rate' })).toHaveAttribute('aria-valuetext', '70')
      expect(regions()[0]).toHaveTextContent('steady')
      expect(screen.queryByRole('button', { name: 'Recheck Bedside' })).toBeNull()
    })

    test('loading holds the body’s place and the capacity waits', () => {
      reduced(<HealthDial loading />)
      expect(screen.getByText('Loading health')).toBeInTheDocument()
      expect(screen.queryByRole('meter')).toBeNull()
      expect(screen.queryByText('9 replicas')).toBeNull()
    })

    test('an error shows its message, dashes the capacity, and Retry calls onRetry', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      reduced(<HealthDial error="Couldn’t reach the metrics service." onRetry={onRetry} />)
      expect(screen.getByText('Couldn’t reach the metrics service.')).toBeInTheDocument()
      expect(screen.queryByRole('meter')).toBeNull()
      expect(screen.getByText('—')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Retry' }))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    test('a window without a snapshot shows the empty state, or your own node', () => {
      const { unmount } = reduced(<HealthDial snapshots={{}} />)
      expect(screen.getByText('No readings yet')).toBeInTheDocument()
      unmount()
      reduced(<HealthDial snapshots={{}} empty={<p>Connect a monitor</p>} />)
      expect(screen.getByText('Connect a monitor')).toBeInTheDocument()
      expect(screen.queryByText('No readings yet')).toBeNull()
    })
  })

  describe('with your data', () => {
    const snapshot = {
      index: 92,
      signals: [{ id: 'sat', label: 'Saturation', value: 40 }],
      parts: [{ id: 'fra', label: 'fra-1', measures: [500, 80] as [number, number], status: 'lagging' }],
    }
    const snapshots = { '15m': snapshot, '6h': { ...snapshot, index: 60 }, '3d': snapshot }

    test('subject, snapshots and copy drive the card', () => {
      reduced(<HealthDial subject="ledger-api" snapshots={snapshots} copy={{ title: 'Ledger health' }} />)
      expect(screen.getByRole('heading', { level: 2, name: 'Ledger health' })).toBeInTheDocument()
      expect(screen.getByText('ledger-api')).toBeInTheDocument()
      expect(screen.getByRole('meter', { name: 'Health index' })).toHaveAttribute('aria-valuetext', '60, Strained')
      expect(regions()[0]).toHaveTextContent('fra-1')
    })

    test('the range is controlled: a pick asks, the prop decides', async () => {
      const user = userEvent.setup()
      const onRangeChange = vi.fn()
      reduced(<HealthDial snapshots={snapshots} range="6h" onRangeChange={onRangeChange} />)
      await user.click(screen.getByRole('button', { name: '15M' }))
      expect(onRangeChange).toHaveBeenCalledWith('15m')
      expect(screen.getByRole('meter', { name: 'Health index' })).toHaveAttribute('aria-valuetext', '60, Strained')
    })

    test('rebalance and add capacity call your handlers', async () => {
      const user = userEvent.setup()
      const onRebalance = vi.fn()
      const onAddCapacity = vi.fn()
      reduced(<HealthDial snapshots={snapshots} capacity={3} onRebalance={onRebalance} onAddCapacity={onAddCapacity} />)
      await user.click(screen.getByRole('button', { name: 'Shift traffic from fra-1' }))
      await waitFor(() => expect(onRebalance).toHaveBeenCalledWith(snapshot.parts[0]))
      await user.click(screen.getByRole('button', { name: 'Add replica' }))
      await waitFor(() => expect(onAddCapacity).toHaveBeenCalledWith(4))
      await waitFor(() => expect(screen.getByText('4 replicas')).toBeInTheDocument())
    })

    test('className, rest props and headingLevel reach the root', () => {
      reduced(<HealthDial embedded headingLevel={3} className="custom-root" data-testid="card" />)
      expect(screen.getByTestId('card')).toHaveClass('custom-root')
      expect(screen.getByRole('heading', { level: 3, name: 'Service health' })).toBeInTheDocument()
    })
  })
})
